import * as WebSocket from 'ws';
import { ILobbyManager } from "../lobby";
import { TimeKeeper } from '../time';
import { SocketContainer } from "./socket";

export class SocketManager {
  private clientTick = 0;
  private readonly sockets: Record<string, SocketContainer> = {};
  constructor(
    private readonly timeKeeper: TimeKeeper,
  ) { }

  create(ws: WebSocket, lobby: ILobbyManager) {
    const socketContainer = new SocketContainer({
      clientId: (this.clientTick++).toString(),
      socket: ws,
      lobby,
      timeKeeper: this.timeKeeper,
      onCleanup: sc => this.onSocketCleanup(sc),
    });
    this.sockets[socketContainer.clientId] = socketContainer;
  }
  private onSocketCleanup(socket: SocketContainer) {
    delete this.sockets[socket.clientId];
  }

  checkAlive() {
    Object.values(this.sockets).forEach(socket => socket.checkAlive());
  }

  health() {
    return {
      tick: this.clientTick,
      clients: Object.values(this.sockets).map(s => s.health()),
    };
  }
}
