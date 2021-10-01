import { BroadcastState, LobbyModState, LobbyPlayerStatus, LobbyState, MessageType, SignalCallback, SocketMessage, StatePatch } from "../types";

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

    args.cb(this.getState());
  }
  unregister(clientId: string) {
    delete this.clients[clientId];

    this.state.players = this.state.players.filter(p => p.clientId !== clientId);
    if (this.state.settings[LobbyStateHostIdKey] === clientId) {
      this.state.settings[LobbyStateHostIdKey] = this.state.players[0]?.clientId ?? 'n/a';
    }

    this.broadcast(this.getState());
  }
  isEmpty() {
    return Object.keys(this.clients).length === 0;
  }

  // host only
  hostUpdateSettings(clientId: string, patch: StatePatch) {
    if (clientId !== this.state.settings[LobbyStateHostIdKey]) {
      throw new Error('only the host can do this');
    }
    this.state.settings = {
      ...this.state.settings,
      ...patch,
    };
    this.broadcast(this.getState());
  }
  hostRemoveMod(clientId: string, modId: string) {
    if (clientId !== this.state.settings[LobbyStateHostIdKey]) {
      throw new Error('only the host can do this');
    }
    this.state.mods = this.state.mods.filter(p => p.modId !== modId);
    this.broadcast(this.getState());
  }

  // public
  uploadMod(mod: LobbyModState) {
    this.state.mods.push(mod);
    this.broadcast(this.getState());
  }

  private getState(): BroadcastState {
    return {
      type: MessageType.BroadcastState,
      state: this.state,
    };
  }
  // todo replace all usages with more granular broadcasts
  private broadcast(msg: SocketMessage) {
    Object.keys(this.clients).forEach(key => {
      this.clients[key](msg);
    });
  }

  health() {
    return {
      signalId: this.lobbyId,
      state: this.state,
      clients: Object.keys(this.clients),
    };
  }
}
