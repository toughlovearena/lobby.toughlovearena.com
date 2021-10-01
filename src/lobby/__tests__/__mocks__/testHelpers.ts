import { MessageType, SignalCallback, SocketMessage } from "../../../types";

export const EmptyCallback: SignalCallback<any> = () => {
  // do nothing
};

export function makeMsg(message: string): SocketMessage {
  return {
    type: MessageType.Test,
    data: message,
  };
}

export class FakeLobbyManager {
  readonly _broadcast: { clientId: string, message: any }[] = [];
  broadcast(clientId: string, msg: any) {
    this._broadcast.push({ clientId, message: msg });
  }
}
