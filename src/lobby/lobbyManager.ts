import { LobbyState, MessageState, SocketMessage, StatePatch } from "../types";

export type SignalCallback<T> = (data: T) => void;


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
    cb({ type: 'state', state: this.state, });
  }
  unregister(clientId: string) {
    delete this.clients[clientId];
    // todo delete from players
  }
  isEmpty() {
    return Object.keys(this.clients).length === 0;
  }

  hostUpdateSettings(patch: StatePatch) {
    this.state.settings = {
      ...this.state.settings,
      ...patch,
    };
    const msg: MessageState = {
      type: 'state',
      state: this.state,
    };
    Object.keys(this.clients).forEach(key => {
      this.clients[key](msg);
    });
  }

  // todo cleanup
  broadcast(clientId: string, data: SocketMessage) {
    // this.history.push({ clientId, message: data, });
    Object.keys(this.clients).forEach(key => {
      if (key === clientId) { return; }
      const cb = this.clients[key];
      cb(data);
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
