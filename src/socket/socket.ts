import * as WebSocket from 'ws';
import { LobbyConnection, LobbyRegistrar } from '../lobby';
import { TimeKeeper } from '../time';
import { MessageReg, MessageType, SocketMessage } from '../types';

export type CleanupSocket = (sc: SocketContainer) => void;

export class SocketContainer {
  readonly clientId: string;
  private readonly socket: WebSocket;
  private readonly lobbyRegistrar: LobbyRegistrar;
  private readonly timeKeeper: TimeKeeper;
  private readonly createdAt: number;
  private updatedAt: number;
  private readonly onCleanup: CleanupSocket;
  static readonly TTL = 10 * 60 * 1000; // 10 minutes

  // stateful
  private comm: LobbyConnection;
  private pending: string[] = [];

  constructor(deps: {
    clientId: string;
    socket: WebSocket;
    lobbyRegistrar: LobbyRegistrar;
    timeKeeper: TimeKeeper;
    onCleanup: CleanupSocket;
  }) {
    this.clientId = deps.clientId;
    this.socket = deps.socket;
    this.lobbyRegistrar = deps.lobbyRegistrar;
    this.timeKeeper = deps.timeKeeper;
    this.onCleanup = deps.onCleanup;

    // track times created, used
    this.createdAt = this.timeKeeper.now();
    this.updatedAt = this.createdAt;

    const { socket } = this;
    socket.on('message', (msg: any) => this.receive(msg));
    socket.on('error', () => this.cleanup());
    socket.on('close', () => this.cleanup());
  }

  checkAlive() {
    const now = this.timeKeeper.now();
    const diff = now - this.updatedAt;
    if (diff > SocketContainer.TTL) {
      this.cleanup();
    }
  }

  private send(data: SocketMessage) {
    this.updatedAt = this.timeKeeper.now();
    this.socket.send(JSON.stringify(data));
  }
  private receive(msg: string) {
    this.updatedAt = this.timeKeeper.now();
    const data = JSON.parse(msg) as SocketMessage;
    if (data.type === MessageType.Register) {
      return this.register(data);
    }
    const { comm } = this;
    if (comm === undefined) {
      this.pending.push(msg);
      return;
    }
    comm.handleMessage(data);
  }

  private cleanup() {
    if (this.comm) {
      this.comm.leave();
    }
    this.socket.terminate();
    this.onCleanup(this);
  }
  private register(data: MessageReg): void {
    if (this.comm !== undefined) {
      throw new Error('signal already registered');
    }
    const lobbyId = data.lobbyId;
    this.comm = this.lobbyRegistrar.join({
      lobbyId,
      clientId: this.clientId,
      cb: cbdata => this.send(cbdata),
    });
    this.processPending();
  }
  private processPending() {
    const toProcess = this.pending.concat();
    this.pending = [];
    toProcess.forEach(pendingMsg => this.receive(pendingMsg));
  }

  health() {
    return {
      clientId: this.clientId,
      group: this.comm?.lobbyId,
      pending: this.pending,
      ageInSeconds: Math.ceil((this.timeKeeper.now() - this.updatedAt) / 1000),
    };
  }
}
