import { Updater } from '@toughlovearena/updater';
import cors from 'cors';
import WebSocketExpress, { Router } from 'websocket-express';
import gbConfig from './greenblue.json';
import { LobbyRegistrar } from './lobby';
import { SocketManager } from './socket';
import { RealClock } from './time';
import { GreenBlueConfig } from './types';

export class Server {
  private readonly port: number;
  private app = new WebSocketExpress();

  constructor(updater: Updater) {
    const { branch, port } = Server.readConfig();
    this.port = port;

    const router = new Router();
    const lobbyRegistrar = new LobbyRegistrar(RealClock);
    const socketManager = new SocketManager(RealClock);

    router.get('/', (req, res) => {
      res.redirect('/health');
    });
    router.get('/health', async (req, res) => {
      const gitHash = await updater.gitter.hash();
      const lobbyData = lobbyRegistrar.health();
      const socketData = socketManager.health();
      const data = {
        gitHash,
        branch,
        started: new Date(updater.startedAt),
        testVer: 0,
        lobbies: {
          total: lobbyData.length,
          rooms: lobbyData.map(ld => ({
            createdAt: new Date(ld.createdAt),
            clients: ld.clients.length,
          })),
        },
        sockets: {
          total: socketData.total,
          clients: socketData.clients.map(sd => ({
            createdAt: new Date(sd.createdAt),
            updatedAt: new Date(sd.updatedAt),
            connected: !!sd.lobbyId,
          }))
        },
      };
      res.send(data);
    });
    router.post('/create', async (req, res) => {
      const lobby = await lobbyRegistrar.create();
      res.send({ lobbyId: lobby.lobbyId, });
    });

    // ws
    router.ws('/connect/:lobbyId/:clientId', async (req, res) => {
      const { lobbyId, clientId } = req.params;
      const lobby = lobbyRegistrar.get(lobbyId);
      if (!(lobby && clientId)) {
        return res.sendError(404);
      }
      const ws = await res.accept();
      socketManager.create(ws, clientId, lobby);
    });

    this.app.use(cors());
    this.app.use(WebSocketExpress.json());
    this.app.use(router);

    // cron
    const period = 30 * 1000; // 30 seconds
    setInterval(() => {
      socketManager.checkAlive();
    }, period);
  }

  listen() {
    const { port } = this;
    this.app.createServer().listen(port, () => {
      // tslint:disable-next-line:no-console
      console.log(`server started at http://localhost:${port}`);
    });
  }

  static readConfig(): { branch: string, port: number, } {
    let branch = 'n/a';
    let port = 2400;
    const config = gbConfig as GreenBlueConfig;
    if (config.branch === 'lobbya') {
      branch = config.branch;
      port = 2401;
    }
    if (config.branch === 'lobbyb') {
      branch = config.branch;
      port = 2402;
    }
    return { branch, port };
  }
}
