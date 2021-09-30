import { LobbyRegistrar } from '../../lobby';
import { FakeTimeKeeper } from '../../__tests__/__mocks__/fakeTimeKeeper';
import { SocketManager } from '../manager';
import { SocketContainer } from '../socket';
import { FakeSocket } from './__mocks__/fakeSocket';

describe('socketManager', () => {
  let lobbyRegistrar: LobbyRegistrar;
  let timeKeeper: FakeTimeKeeper;
  let sut: SocketManager;

  beforeEach(() => {
    lobbyRegistrar = new LobbyRegistrar();
    timeKeeper = new FakeTimeKeeper();
    sut = new SocketManager(lobbyRegistrar, timeKeeper);
  });

  test('create()', () => {
    expect(sut.health().clients.length).toBe(0);

    const ws = new FakeSocket();
    sut.create(ws._cast());
    expect(sut.health().clients.length).toBe(1);

    ws._trigger('close');
    expect(sut.health().clients.length).toBe(0);
  });

  test('checkAlive()', () => {
    expect(sut.health().clients.length).toBe(0);

    const ws = new FakeSocket();
    sut.create(ws._cast());
    sut.checkAlive();
    expect(sut.health().clients.length).toBe(1);

    timeKeeper._increment(SocketContainer.TTL + 1);
    sut.checkAlive();
    expect(sut.health().clients.length).toBe(0);
  });
});
