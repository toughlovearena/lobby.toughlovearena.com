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
  BroadcastSettings = 'broadcastSettings',
  BroadcastPlayers = 'broadcastPlayers',
  BroadcastMods = 'broadcastMods',
  UpdateStatus = 'updateStatus',
  HostUpdateSettings = 'updateSettings',
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
export interface BroadcastSettings {
  type: MessageType.BroadcastSettings;
  state: StateSettings;
}
export interface BroadcastPlayers {
  type: MessageType.BroadcastPlayers;
  state: LobbyPlayerState[];
}
export interface BroadcastMods {
  type: MessageType.BroadcastMods;
  state: LobbyModState[];
}
export interface UpdateStatus {
  type: MessageType.UpdateStatus;
  status: LobbyPlayerStatus;
}
export interface HostUpdateSettings {
  type: MessageType.HostUpdateSettings;
  patch: SettingsPatch;
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
export type BroadcastMessage = (
  BroadcastSettings |
  BroadcastPlayers |
  BroadcastMods
);
export type SocketMessage = (
  MessageReg |
  BroadcastMessage |
  UpdateStatus |
  HostUpdateSettings |
  UploadMod |
  HostRemoveMod |
  MessageError |
  MessageTest
);

export type SignalCallback<T> = (data: T) => void;
