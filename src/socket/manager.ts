import * as WebSocket from 'ws';
import { ILobbyManager } from "../lobby";
import { TimeKeeper } from '../time';
import { SocketContainer } from "./socket";

export class SocketManager {
  private clientCount = 0;
  private readonly sockets: Record<string, SocketContainer> = {};
  constructor(
    private readonly timeKeeper: TimeKeeper,
  ) { }

  create(ws: WebSocket, clientId: string, lobby: ILobbyManager) {
    this.clientCount++;
    const socketContainer = new SocketContainer({
      clientId,
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
      allTime: this.clientCount,
      clients: Object.values(this.sockets).map(s => s.health()),
    };
  }
}
