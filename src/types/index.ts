import { BroadcastMessage } from './apiTypes';

export * from './apiTypes';

type SignalCallback<T> = (data: T) => void;
export type BroadcastCallback = SignalCallback<BroadcastMessage>;
