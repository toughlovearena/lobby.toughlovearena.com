import { Updater } from '@toughlovearena/updater';
import cors from 'cors';
import WebSocketExpress, { Router } from 'websocket-express';
import { LobbyRegistrar } from './lobby';
import { SocketManager } from './socket';
import { RealClock } from './time';

export class Server {
  private app = new WebSocketExpress();

  constructor(updater: Updater) {
    const router = new Router();
    const lobbyRegistrar = new LobbyRegistrar(RealClock);
    const socketManager = new SocketManager(RealClock);

    router.get('/', (req, res) => {
      res.redirect('/health');
    });
    router.get('/health', async (req, res) => {
      const gitHash = await updater.gitter.hash();
      const data = {
        gitHash,
        started: new Date(updater.startedAt),
        testVer: 3,
        lobbies: lobbyRegistrar.health(),
        sockets: socketManager.health(),
      };
      res.send(data);
    });
    router.post('/create', async (req, res) => {
      const lobby = await lobbyRegistrar.create();
      res.send({ lobbyId: lobby.lobbyId, });
    });

    // ws
    router.ws('/connect/:lobbyId', async (req, res) => {
      const { lobbyId } = req.params;
      const lobby = lobbyRegistrar.get(lobbyId);
      if (!lobby) {
        return res.sendError(404);
      }
      const ws = await res.accept();
      socketManager.create(ws, lobby);
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

  listen(port: number) {
    this.app.createServer().listen(port, () => {
      // tslint:disable-next-line:no-console
      console.log(`server started at http://localhost:${port}`);
    });
  }
}
