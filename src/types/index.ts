import { BroadcastMessage } from './apiTypes';

export * from './apiTypes';

export interface GreenBlueConfig {
  branch: 'lobbya' | 'lobbyb' | undefined,
};

type SignalCallback<T> = (data: T) => void;
export type BroadcastCallback = SignalCallback<BroadcastMessage>;
