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
    const organizer = new LobbyRegistrar();
    const manager = new SocketManager(organizer, RealClock);

    router.get('/', (req, res) => {
      res.redirect('/health');
    });
    router.get('/health', async (req, res) => {
      const gitHash = await updater.gitter.hash();
      const data = {
        gitHash,
        started: new Date(updater.startedAt),
        testVer: 3,
        sockets: manager.health(),
        organizer: organizer.health(),
      };
      res.send(data);
    });

    // ws
    router.ws('/connect', async (req, res) => {
      const ws = await res.accept();
      manager.create(ws);
    });

    this.app.use(cors());
    this.app.use(WebSocketExpress.json());
    this.app.use(router);

    // cron
    const period = 30 * 1000; // 30 seconds
    setInterval(() => {
      manager.checkAlive();
    }, period);
  }

  listen(port: number) {
    this.app.createServer().listen(port, () => {
      // tslint:disable-next-line:no-console
      console.log(`server started at http://localhost:${port}`);
    });
  }
}
