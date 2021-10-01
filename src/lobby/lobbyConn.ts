import { MessageError, MessageType, SignalCallback, SocketMessage } from "../types";
import { ILobbyManager, LobbyManager } from "./lobbyManager";

export class LobbyConnection {
  readonly lobbyId: string;
  readonly clientId: string;
  private readonly lobby: ILobbyManager;
  private readonly cb: SignalCallback<SocketMessage>;
  private readonly onLeave: () => void;
  private hasLeft = false;
  constructor(args: {
    clientId: string;
    lobby: LobbyManager;
    cb: SignalCallback<SocketMessage>;
    onLeave: () => void;
  }) {
    this.lobbyId = args.lobby.lobbyId;
    this.clientId = args.clientId;
    this.lobby = args.lobby;
    this.cb = args.cb;
    this.onLeave = args.onLeave;
  }

  handleMessage(msg: SocketMessage) {
    if (this.hasLeft) { return; }
    try {
      if (msg.type === MessageType.UpdateStatus) {
        return this.lobby.updateStatus(this.clientId, msg.status);
      }
      if (msg.type === MessageType.HostUpdateSettings) {
        return this.lobby.hostUpdateSettings(this.clientId, msg.patch);
      }
      if (msg.type === MessageType.UploadMod) {
        return this.lobby.uploadMod(msg.data);
      }
      if (msg.type === MessageType.HostRemoveMod) {
        return this.lobby.hostRemoveMod(this.clientId, msg.modId);
      }
      throw new Error('unsupported type: ' + msg.type);
    } catch (err) {
      const msgErr: MessageError = {
        type: MessageType.Error,
        message: (err as Error).message,
      };
      this.cb(msgErr);
    }
  }
  leave() {
    this.hasLeft = true;
    return this.onLeave();
  }
}
