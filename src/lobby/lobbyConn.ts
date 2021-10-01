import { MessageType, SocketMessage } from "../types";
import { LobbyManager } from "./lobbyManager";

export class LobbyConnection {
  readonly lobbyId: string;
  readonly clientId: string;
  private readonly lobby: LobbyManager;
  private readonly onLeave: () => void;
  private hasLeft = false;
  constructor(args: {
    clientId: string;
    lobby: LobbyManager;
    onLeave: () => void;
  }) {
    this.lobbyId = args.lobby.lobbyId;
    this.clientId = args.clientId;
    this.lobby = args.lobby;
    this.onLeave = args.onLeave;
  }

  handleMessage(msg: SocketMessage) {
    if (this.hasLeft) { return; }
    if (msg.type === MessageType.UpdateState) {
      return this.lobby.hostUpdateSettings(msg.patch);
    }
    throw new Error('unsupported type: ' + msg.type);
  }
  leave() {
    this.hasLeft = true;
    return this.onLeave();
  }
}
