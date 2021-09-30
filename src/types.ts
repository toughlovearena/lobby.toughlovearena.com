
export interface LobbyState {
  fixed: any;
  settings: any;
  players: any[];
  mods: any[];
}

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
export interface MessageState {
  type: 'state';
  data: LobbyState;
}

export type SocketMessage = (
  MessageReg |
  MessageErr |
  MessageData |
  MessageState
);
