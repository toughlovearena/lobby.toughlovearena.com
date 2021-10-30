import { TimeKeeper } from "../time";
import { LobbyManager } from "./lobbyManager";

export class LobbyRegistrar {
  private lobbyCount = 0;
  private readonly lookup: Record<string, LobbyManager> = {};
  constructor(private readonly timeKeeper: TimeKeeper) { }

  async create(): Promise<LobbyManager> {
    const lobbyId = (this.timeKeeper.now() % 1000000).toString().padStart(6, '0');
    if (this.lookup[lobbyId]) {
      await this.timeKeeper.sleep(7);
      return this.create();
    }
    this.lobbyCount++;
    const lobby = new LobbyManager(lobbyId, this.timeKeeper, () => this.checkPrune(lobbyId));
    setTimeout(() => this.checkPrune(lobbyId), lobby.TTL + 1);
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
  pruneAll(): number {
    const keys = Object.keys(this.lookup);
    let pruned = 0;
    keys.forEach(lobbyId => {
      if (this.lookup[lobbyId]?.isDead()) {
        delete this.lookup[lobbyId];
        pruned++;
      }
    });
    return pruned;
  }

  health() {
    return {
      allTime: this.lobbyCount,
      lobbies: Object.values(this.lookup).map(group => group.health()),
    };
  }
}
