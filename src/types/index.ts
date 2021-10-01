type StateSettingsValue = boolean | number | string
type StateSettings = Record<string, StateSettingsValue>;
export interface LobbyState {
  settings: StateSettings;
  players: any[];
  mods: any[];
}
export type StatePatch = Record<string, StateSettingsValue>;

export enum MessageType {
  Register = 'register',
  UpdateState = 'updateState',
  BroadcastState = 'broadcastState',
  Test = 'test',
}
export interface MessageReg {
  type: MessageType.Register;
  lobbyId: string;
}
export interface UpdateState {
  type: MessageType.UpdateState;
  patch: StatePatch;
}
export interface BroadcastState {
  type: MessageType.BroadcastState;
  state: LobbyState;
}
export interface MessageTest {
  type: MessageType.Test;
  data: string;
}
export type SocketMessage = (
  MessageReg |
  UpdateState |
  BroadcastState |
  MessageTest
);

export type SignalCallback<T> = (data: T) => void;
