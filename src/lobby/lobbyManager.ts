import { LobbyConnection } from ".";
import { TimeKeeper } from "../time";
import { BroadcastCallback, BroadcastMessage, BroadcastMods, BroadcastPlayers, BroadcastSettings, LobbyModState, LobbyPlayerStatus, LobbyState, MessageType, SettingsPatch } from "../types";

export interface LobbyRegistrationArgs {
  clientId: string,
  tag: string,
  cb: BroadcastCallback,
}
export interface LobbyManagerHealth {
  lobbyId: string;
  state: LobbyState;
  clients: string[];
}

export interface ILobbyManager {
  register(args: LobbyRegistrationArgs): LobbyConnection;
  isDead(): boolean;

  // host only
  hostUpdateSettings(clientId: string, patch: SettingsPatch): void;
  hostRemoveMod(clientId: string, modId: string): void;

  // public
  updateReady(clientId: string, isReady: boolean): void;
  updateStatus(clientId: string, status: LobbyPlayerStatus): void;
  uploadMod(mod: LobbyModState): void;

  health(): LobbyManagerHealth;
}

// todo put into types
const LobbyStateHostIdKey = 'hostId';
const LobbyStateReady1Key = 'ready1';
const LobbyStateReady2Key = 'ready2';
export class LobbyManager implements ILobbyManager {
  readonly TTL = 30 * 1000; // 30s
  private createdAt: number;
  private state: LobbyState;
  private readonly clients: Record<string, BroadcastCallback> = {};
  constructor(
    readonly lobbyId: string,
    private readonly timeKeeper: TimeKeeper,
    private readonly onUserLeave: () => void,
  ) {
    this.createdAt = this.timeKeeper.now();
    this.state = {
      lobbyId: this.lobbyId,
      settings: {},
      players: [],
      mods: [],
    };
  }

  register(args: LobbyRegistrationArgs) {
    if (this.clients[args.clientId]) {
      throw new Error('cannot register twice');
    }
    this.clients[args.clientId] = args.cb;

    if (this.state.players.length === 0) {
      this.state.settings[LobbyStateHostIdKey] = args.clientId;
    }
    this.state.players.push({
      status: LobbyPlayerStatus.Queue,
      clientId: args.clientId,
      tag: args.tag,
    });

    args.cb(this.getSettings());
    this.broadcast(this.getPlayers());
    args.cb(this.getMods());

    return new LobbyConnection({
      clientId: args.clientId,
      lobby: this,
      cb: args.cb,
      onLeave: () => this.unregister(args.clientId),
    });
  }
  private unregister(clientId: string) {
    delete this.clients[clientId];

    this.state.players = this.state.players.filter(p => p.clientId !== clientId);
    if (this.state.settings[LobbyStateHostIdKey] === clientId) {
      this.state.settings[LobbyStateHostIdKey] = this.state.players[0]?.clientId ?? 'n/a';
      this.broadcast(this.getSettings());
    }

    this.broadcast(this.getPlayers());

    this.onUserLeave();
  }
  isDead() {
    return (
      (Object.keys(this.clients).length === 0) &&
      (this.timeKeeper.now() > this.createdAt + this.TTL)
    );
  }

  // host only
  hostUpdateSettings(clientId: string, patch: SettingsPatch) {
    const hostId = this.state.settings[LobbyStateHostIdKey];
    if (hostId !== undefined && clientId !== hostId) {
      throw new Error('only the host can do this');
    }
    this.state.settings = {
      ...this.state.settings,
      ...patch,
    };
    this.broadcast(this.getSettings());
  }
  hostRemoveMod(clientId: string, modId: string) {
    const hostId = this.state.settings[LobbyStateHostIdKey];
    if (hostId !== undefined && clientId !== hostId) {
      throw new Error('only the host can do this');
    }
    this.state.mods = this.state.mods.filter(p => p.modId !== modId);
    this.broadcast(this.getMods());
  }

  // public
  updateReady(clientId: string, isReady: boolean) {
    const index = this.state.players.findIndex(ps => ps.clientId === clientId);
    if (index < 0) {
      throw new Error('cannot updateStatus: player mising');
    }
    if (index < 2) {
      if (index === 0) {
        this.state.settings[LobbyStateReady1Key] = isReady;
      }
      if (index === 1) {
        this.state.settings[LobbyStateReady2Key] = isReady;
      }
      this.broadcast(this.getSettings());
    }
  }
  updateStatus(clientId: string, status: LobbyPlayerStatus) {
    const player = this.state.players.filter(p => p.clientId === clientId)[0];
    if (!player) {
      throw new Error('cannot updateStatus: player mising');
    }
    player.status = status;
    this.state.players = [
      ...this.state.players.filter(p => p.clientId !== clientId),
      player
    ];
    this.broadcast(this.getPlayers());
  }
  uploadMod(mod: LobbyModState) {
    this.state.mods.push(mod);
    this.broadcast(this.getMods());
  }

  private getSettings(): BroadcastSettings {
    return {
      type: MessageType.BroadcastSettings,
      state: { ...this.state.settings },
    };
  }
  private getPlayers(): BroadcastPlayers {
    return {
      type: MessageType.BroadcastPlayers,
      state: [...this.state.players],
    };
  }
  private getMods(): BroadcastMods {
    return {
      type: MessageType.BroadcastMods,
      state: [...this.state.mods],
    };
  }
  private broadcast(msg: BroadcastMessage) {
    Object.keys(this.clients).forEach(key => {
      this.clients[key](msg);
    });
  }

  health() {
    return {
      lobbyId: this.lobbyId,
      state: this.state,
      clients: Object.keys(this.clients),
    };
  }
}
