import { ILobbyManager, LobbyManager } from '../../lobby';
import { FakeTimeKeeper } from '../../__tests__/__mocks__/fakeTimeKeeper';
import { SocketManager } from '../manager';
import { SocketContainer } from '../socket';
import { FakeSocket } from './__mocks__/fakeSocket';

describe('socketManager', () => {
  let timeKeeper: FakeTimeKeeper;
  let lobby: ILobbyManager;
  let sut: SocketManager;

  beforeEach(() => {
    timeKeeper = new FakeTimeKeeper();
    lobby = new LobbyManager('lid', timeKeeper, () => { });
    sut = new SocketManager(timeKeeper);
  });

  test('create()', () => {
    expect(sut.health().clients.length).toBe(0);

    const ws = new FakeSocket();
    sut.create(ws._cast(), lobby);
    expect(sut.health().clients.length).toBe(1);

    ws._trigger('close');
    expect(sut.health().clients.length).toBe(0);
  });

  test('checkAlive()', () => {
    expect(sut.health().clients.length).toBe(0);

    const ws = new FakeSocket();
    sut.create(ws._cast(), lobby);
    sut.checkAlive();
    expect(sut.health().clients.length).toBe(1);

    timeKeeper._increment(SocketContainer.TTL + 1);
    sut.checkAlive();
    expect(sut.health().clients.length).toBe(0);
  });
});
