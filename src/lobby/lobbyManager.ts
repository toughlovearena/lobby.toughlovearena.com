import { BroadcastMessage, BroadcastMods, BroadcastPlayers, BroadcastSettings, LobbyModState, LobbyPlayerStatus, LobbyState, MessageType, SettingsPatch, SignalCallback, SocketMessage } from "../types";

const LobbyStateHostIdKey = 'hostId';
export class LobbyManager {
  readonly lobbyId: string;
  private state: LobbyState = {
    settings: {},
    players: [],
    mods: [],
  };
  private readonly clients: Record<string, SignalCallback<SocketMessage>> = {};
  constructor(lobbyId: string) {
    this.lobbyId = lobbyId;
  }

  register(args: {
    clientId: string,
    tag: string,
    cb: SignalCallback<SocketMessage>,
  }) {
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
    args.cb(this.getPlayers());
    args.cb(this.getMods());
  }
  unregister(clientId: string) {
    delete this.clients[clientId];

    this.state.players = this.state.players.filter(p => p.clientId !== clientId);
    if (this.state.settings[LobbyStateHostIdKey] === clientId) {
      this.state.settings[LobbyStateHostIdKey] = this.state.players[0]?.clientId ?? 'n/a';
      this.broadcast(this.getSettings());
    }

    this.broadcast(this.getPlayers());
  }
  isEmpty() {
    return Object.keys(this.clients).length === 0;
  }

  // host only
  hostUpdateSettings(clientId: string, patch: SettingsPatch) {
    if (clientId !== this.state.settings[LobbyStateHostIdKey]) {
      throw new Error('only the host can do this');
    }
    this.state.settings = {
      ...this.state.settings,
      ...patch,
    };
    this.broadcast(this.getSettings());
  }
  hostRemoveMod(clientId: string, modId: string) {
    if (clientId !== this.state.settings[LobbyStateHostIdKey]) {
      throw new Error('only the host can do this');
    }
    this.state.mods = this.state.mods.filter(p => p.modId !== modId);
    this.broadcast(this.getMods());
  }

  // public
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
      state: this.state.settings,
    };
  }
  private getPlayers(): BroadcastPlayers {
    return {
      type: MessageType.BroadcastPlayers,
      state: this.state.players,
    };
  }
  private getMods(): BroadcastMods {
    return {
      type: MessageType.BroadcastMods,
      state: this.state.mods,
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
