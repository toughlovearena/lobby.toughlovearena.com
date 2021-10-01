export interface TimeKeeper {
  now(): number;
  sleep(ms: number): Promise<void>;
}

export const RealClock: TimeKeeper = {
  now: () => new Date().getTime(),
  sleep: (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms)),
};
