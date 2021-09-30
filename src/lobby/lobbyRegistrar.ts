import { SocketMessage } from "../types";
import { LobbyConnection } from "./lobbyConn";
import { LobbyManager, SignalCallback } from "./lobbyManager";

export class LobbyRegistrar {
  private readonly lookup: Record<string, LobbyManager> = {};

  join(args: {
    lobbyId: string,
    clientId: string,
    cb: SignalCallback<SocketMessage>,
  }): LobbyConnection {
    this.lookup[args.lobbyId] = this.lookup[args.lobbyId] ?? new LobbyManager(args.lobbyId);
    const lobby = this.lookup[args.lobbyId];
    lobby.register(args.clientId, args.cb);
    return new LobbyConnection({
      clientId: args.clientId,
      lobby,
      onLeave: () => this.onCommLeave({
        clientId: args.clientId,
        lobby,
      }),
    });
  }
  private onCommLeave(args: {
    clientId: string,
    lobby: LobbyManager,
  }) {
    args.lobby.unregister(args.clientId);
    if (args.lobby.isEmpty()) {
      delete this.lookup[args.lobby.lobbyId];
    }
  }

  health() {
    return Object.values(this.lookup).map(group => group.health());
  }
}
