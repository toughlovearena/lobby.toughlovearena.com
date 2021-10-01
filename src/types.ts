
type StateSettingsValue = boolean | number | string
type StateSettings = Record<string, StateSettingsValue>;
export interface LobbyState {
  settings: StateSettings;
  players: any[];
  mods: any[];
}
export type StatePatch = Record<string, StateSettingsValue>;

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
  state: LobbyState;
}

export type SocketMessage = (
  MessageReg |
  MessageErr |
  MessageData |
  MessageState
);
