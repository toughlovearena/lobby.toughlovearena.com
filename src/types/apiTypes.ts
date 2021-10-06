type StateSettingsValue = boolean | number | string
type StateSettings = Record<string, StateSettingsValue>;
export type SettingsPatch = Record<string, StateSettingsValue>;

export interface LobbyMatchState {
  peerId?: string;
  gameConfigJson?: string;
  started: boolean;
}
export type LobbyMatchPatch = Partial<LobbyMatchState>;
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
  match?: LobbyMatchState;
  settings: StateSettings;
  players: LobbyPlayerState[];
  mods: LobbyModState[];
}
export interface LobbyInputBatch {
  round: number;
  startTick: number;
  input1?: string;
  input2?: string;
}
export interface LobbyInputHistory {
  history: LobbyInputBatch[];
}

export enum MessageType {
  BroadcastMatch = 'broadcastMatch',
  BroadcastSettings = 'broadcastSettings',
  BroadcastPlayers = 'broadcastPlayers',
  BroadcastMods = 'broadcastMods',
  BroadcastInputBatch = 'broadcastInputBatch',
  BroadcastInputHistory = 'broadcastInputHistory',
  SendInputBatch = 'sendInputBatch',
  SendMatchPatch = 'sendMatchPatch',
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
export interface BroadcastMatch {
  type: MessageType.BroadcastMatch;
  state: LobbyMatchState | undefined;
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
export interface BroadcastInputBatch {
  type: MessageType.BroadcastInputBatch;
  state: LobbyInputBatch;
}
export interface BroadcastInputHistory {
  type: MessageType.BroadcastInputHistory;
  state: LobbyInputHistory;
}
export interface SendInputBatch {
  type: MessageType.SendInputBatch;
  state: LobbyInputBatch;
}
export interface SendMatchPatch {
  type: MessageType.SendMatchPatch;
  state: LobbyMatchPatch;
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
  BroadcastMatch |
  BroadcastSettings |
  BroadcastPlayers |
  BroadcastMods |
  BroadcastInputBatch |
  BroadcastInputHistory |
  ReplyError
);
export type ClientMessage = (
  SendInputBatch |
  SendMatchPatch |
  SendRegister |
  SendReady |
  SendUpdateStatus |
  SendHostUpdateStatus |
  SendHostKickPlayer |
  SendHostUpdateSettings |
  SendUploadMod |
  SendHostRemoveMod
);
