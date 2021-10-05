import { BroadcastCallback, ClientMessage, MessageType, ReplyError } from "../types";
import { ILobbyManager, LobbyManager } from "./lobbyManager";

export class LobbyConnection {
  readonly lobbyId: string;
  readonly clientId: string;
  private readonly lobby: ILobbyManager;
  private readonly cb: BroadcastCallback;
  private readonly onLeave: () => void;
  private hasLeft = false;
  constructor(args: {
    clientId: string;
    lobby: LobbyManager;
    cb: BroadcastCallback;
    onLeave: () => void;
  }) {
    this.lobbyId = args.lobby.lobbyId;
    this.clientId = args.clientId;
    this.lobby = args.lobby;
    this.cb = args.cb;
    this.onLeave = args.onLeave;
  }

  handleMessage(msg: ClientMessage) {
    if (this.hasLeft) { return; }
    try {
      if (msg.type === MessageType.SendReady) {
        return this.lobby.updateReady(this.clientId, msg.ready);
      }
      if (msg.type === MessageType.SendUpdateStatus) {
        return this.lobby.updateStatus(this.clientId, msg.status);
      }
      if (msg.type === MessageType.SendHostUpdateStatus) {
        return this.lobby.hostUpdateStatus(this.clientId, msg.clientId, msg.status);
      }
      if (msg.type === MessageType.SendHostKickPlayer) {
        return this.lobby.hostKickPlayer(this.clientId, msg.clientId);
      }
      if (msg.type === MessageType.SendHostUpdateSettings) {
        return this.lobby.hostUpdateSettings(this.clientId, msg.patch);
      }
      if (msg.type === MessageType.SendUploadMod) {
        return this.lobby.uploadMod(msg.data);
      }
      if (msg.type === MessageType.SendHostRemoveMod) {
        return this.lobby.hostRemoveMod(this.clientId, msg.modId);
      }
      throw new Error('unsupported type: ' + msg.type);
    } catch (err) {
      const msgErr: ReplyError = {
        type: MessageType.ReplyError,
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
