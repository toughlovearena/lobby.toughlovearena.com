
export interface MessageReg {
  type: 'register';
  signalId: string;
}
export interface MessageErr {
  type: 'error';
  error: string;
}
export interface MessageData {
  type: 'data';
  error: any;
}

export type SocketMessage = MessageReg | MessageErr | MessageData;
