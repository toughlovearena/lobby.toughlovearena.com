import { SocketMessage } from "../types";
import { LobbyManager } from "./lobbyManager";

export class LobbyConnection {
  readonly lobbyId: string;
  readonly clientId: string;
  private readonly group: LobbyManager;
  private readonly onLeave: () => void;
  private hasLeft = false;
  constructor(args: {
    clientId: string;
    lobby: LobbyManager;
    onLeave: () => void;
  }) {
    this.lobbyId = args.lobby.lobbyId;
    this.clientId = args.clientId;
    this.group = args.lobby;
    this.onLeave = args.onLeave;
  }

  broadcast(msg: SocketMessage) {
    if (this.hasLeft) { return; }
    return this.group.broadcast(this.clientId, msg);
  }
  leave() {
    this.hasLeft = true;
    return this.onLeave();
  }
}
