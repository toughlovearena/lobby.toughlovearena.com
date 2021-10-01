import { BroadcastState, LobbyState, MessageType, SignalCallback, SocketMessage, StatePatch } from "../types";

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

  register(clientId: string, cb: SignalCallback<SocketMessage>) {
    this.clients[clientId] = cb;
    cb(this.getState());
  }
  unregister(clientId: string) {
    delete this.clients[clientId];
    // todo delete from players
    this.broadcast(this.getState());
  }
  isEmpty() {
    return Object.keys(this.clients).length === 0;
  }

  hostUpdateSettings(patch: StatePatch) {
    this.state.settings = {
      ...this.state.settings,
      ...patch,
    };
    this.broadcast(this.getState());
  }

  private getState(): BroadcastState {
    return {
      type: MessageType.BroadcastState,
      state: this.state,
    };
  }
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
