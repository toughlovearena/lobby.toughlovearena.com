import { ClientMessage, MessageType } from "../types";
import { ILobbyManager, LobbyManager } from "./lobbyManager";

export class LobbyConnection {
  readonly lobbyId: string;
  readonly clientId: string;
  private readonly lobby: ILobbyManager;
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

  handleMessage(msg: ClientMessage) {
    if (this.hasLeft) { return; }
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
    if (msg.type === MessageType.SendInputBatch) {
      return this.lobby.handleInputBatch(msg.state);
    }
    if (msg.type === MessageType.SendMatchPatch) {
      return this.lobby.patchMatch(msg.state);
    }
    if (msg.type === MessageType.SendMatchResult) {
      return this.lobby.endMatch(msg.loserIds);
    }
    throw new Error('unsupported type: ' + msg.type);
  }
  leave() {
    this.hasLeft = true;
    return this.onLeave();
  }
}
