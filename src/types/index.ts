type StateSettingsValue = boolean | number | string
type StateSettings = Record<string, StateSettingsValue>;
export type SettingsPatch = Record<string, StateSettingsValue>;
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
  UpdateStatus = 'updateStatus',
  HostUpdateSettings = 'updateSettings',
  BroadcastState = 'broadcastState',
  UploadMod = 'uploadMod',
  HostRemoveMod = 'removeMod',
  Error = 'error',
  Test = 'test',
}
export interface MessageReg {
  type: MessageType.Register;
  lobbyId: string;
  tag: string;
}
export interface UpdateStatus {
  type: MessageType.UpdateStatus;
  status: LobbyPlayerStatus;
}
export interface HostUpdateSettings {
  type: MessageType.HostUpdateSettings;
  patch: SettingsPatch;
}
export interface BroadcastState {
  type: MessageType.BroadcastState;
  state: LobbyState;
}
export interface UploadMod {
  type: MessageType.UploadMod;
  data: LobbyModState;
}
export interface HostRemoveMod {
  type: MessageType.HostRemoveMod;
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
  UpdateStatus |
  HostUpdateSettings |
  BroadcastState |
  UploadMod |
  HostRemoveMod |
  MessageError |
  MessageTest
);

export type SignalCallback<T> = (data: T) => void;
