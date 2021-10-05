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
  lobbyId: string;
  settings: StateSettings;
  players: LobbyPlayerState[];
  mods: LobbyModState[];
}

export enum MessageType {
  BroadcastSettings = 'broadcastSettings',
  BroadcastPlayers = 'broadcastPlayers',
  BroadcastMods = 'broadcastMods',
  SendRegister = 'register',
  SendReady = 'ready',
  SendUpdateStatus = 'updateStatus',
  SendHostUpdateStatus = 'hostSetStatus',
  SendHostKickPlayer = 'kickPlayer',
  SendHostUpdateSettings = 'updateSettings',
  SendUploadMod = 'uploadMod',
  SendHostRemoveMod = 'removeMod',
  ReplyError = 'error',
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
export interface SendRegister {
  type: MessageType.SendRegister;
  tag: string;
}
export interface SendReady {
  type: MessageType.SendReady;
  ready: boolean;
}
export interface SendUpdateStatus {
  type: MessageType.SendUpdateStatus;
  status: LobbyPlayerStatus;
}
export interface SendHostUpdateStatus {
  type: MessageType.SendHostUpdateStatus;
  status: LobbyPlayerStatus;
  clientId: string;
}
export interface SendHostKickPlayer {
  type: MessageType.SendHostKickPlayer;
  clientId: string;
}
export interface SendHostUpdateSettings {
  type: MessageType.SendHostUpdateSettings;
  patch: SettingsPatch;
}
export interface SendUploadMod {
  type: MessageType.SendUploadMod;
  data: LobbyModState;
}
export interface SendHostRemoveMod {
  type: MessageType.SendHostRemoveMod;
  modId: string;
}
export interface ReplyError {
  type: MessageType.ReplyError;
  message: string;
}
export type BroadcastMessage = (
  BroadcastSettings |
  BroadcastPlayers |
  BroadcastMods |
  ReplyError
);
export type ClientMessage = (
  SendRegister |
  SendReady |
  SendUpdateStatus |
  SendHostUpdateStatus |
  SendHostKickPlayer |
  SendHostUpdateSettings |
  SendUploadMod |
  SendHostRemoveMod
);

type SignalCallback<T> = (data: T) => void;
export type BroadcastCallback = SignalCallback<BroadcastMessage>;
