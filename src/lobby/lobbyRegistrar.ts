import { TimeKeeper } from "../time";
import { BroadcastCallback } from "../types";
import { LobbyManager } from "./lobbyManager";

export interface LobbyRegistrarJoinArgs {
  lobby: LobbyManager;
  clientId: string;
  tag: string;
  cb: BroadcastCallback;
}

export class LobbyRegistrar {
  private readonly lookup: Record<string, LobbyManager> = {};
  constructor(private readonly timeKeeper: TimeKeeper) { }

  async create(): Promise<LobbyManager> {
    const lobbyId = (this.timeKeeper.now() % 1000000).toString().padStart(6, '0');
    if (this.lookup[lobbyId]) {
      await this.timeKeeper.sleep(7);
      return this.create();
    }
    const lobby = new LobbyManager(lobbyId, this.timeKeeper, () => this.checkPrune(lobbyId));
    this.lookup[lobbyId] = lobby;
    return lobby;
  }
  get(lobbyId: string): LobbyManager | undefined {
    return this.lookup[lobbyId];
  }

  checkPrune(lobbyId: string) {
    if (this.lookup[lobbyId]?.isDead()) {
      delete this.lookup[lobbyId];
    }
  }
  // todo cron to get orphans?
  pruneAll() {
    const keys = Object.keys(this.lookup);
    keys.forEach(lobbyId => {
      if (this.lookup[lobbyId]?.isDead()) {
        delete this.lookup[lobbyId];
      }
    })
  }

  health() {
    return Object.values(this.lookup).map(group => group.health());
  }
}
