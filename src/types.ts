
export interface MessageReg {
  type: 'register';
  lobbyId: string;
}
export interface MessageErr {
  type: 'error';
  error: string;
}
export interface MessageData {
  type: 'data';
  message: any;
}

export type SocketMessage = MessageReg | MessageErr | MessageData;
