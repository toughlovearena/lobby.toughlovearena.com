type StateSettingsValue = boolean | number | string
type StateSettings = Record<string, StateSettingsValue>;
export type StatePatch = Record<string, StateSettingsValue>;
export enum LobbyPlayerStatus {
  Queue = 'queue',
  Spectate = 'spectate',
}
export interface LobbyPlayerState {
  status: LobbyPlayerStatus;
  clientId: string;
  tag: string;
}
export interface LobbyModState {
  modId: string;
  configJson: string;
}
export interface LobbyState {
  settings: StateSettings;
  players: LobbyPlayerState[];
  mods: LobbyModState[];
}

export enum MessageType {
  Register = 'register',
  UpdateState = 'updateState',
  BroadcastState = 'broadcastState',
  UploadMod = 'uploadMod',
  RemoveMod = 'removeMod',
  Error = 'error',
  Test = 'test',
}
export interface MessageReg {
  type: MessageType.Register;
  lobbyId: string;
  tag: string;
}
export interface UpdateState {
  type: MessageType.UpdateState;
  patch: StatePatch;
}
export interface BroadcastState {
  type: MessageType.BroadcastState;
  state: LobbyState;
}
export interface UploadMod {
  type: MessageType.UploadMod;
  data: LobbyModState;
}
export interface RemoveMod {
  type: MessageType.RemoveMod;
  modId: string;
}
export interface MessageError {
  type: MessageType.Error;
  message: string;
}
export interface MessageTest {
  type: MessageType.Test;
  data: string;
}
export type SocketMessage = (
  MessageReg |
  UpdateState |
  BroadcastState |
  UploadMod |
  RemoveMod |
  MessageError |
  MessageTest
);

export type SignalCallback<T> = (data: T) => void;
