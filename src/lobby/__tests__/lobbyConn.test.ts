import { LobbyConnection } from '../lobbyConn';
import { LobbyManager } from '../lobbyManager';
import { FakeLobbyManager, makeMsg } from './__mocks__/testHelpers';

describe('communicator', () => {
  test('broadcast', () => {
    const fakeLobby = new FakeLobbyManager();
    let leaveCount = 0;
    const sut = new LobbyConnection({
      clientId: 'c1',
      lobby: fakeLobby as any as LobbyManager,
      onLeave: () => leaveCount++,
    });

    expect(fakeLobby._broadcast).toStrictEqual([]);
    expect(leaveCount).toBe(0);

    const msg1 = makeMsg('hello1');
    sut.broadcast(msg1);
    expect(fakeLobby._broadcast).toStrictEqual([
      { clientId: 'c1', message: msg1 },
    ]);
    expect(leaveCount).toBe(0);

    const msg2 = makeMsg('hello2');
    sut.broadcast(msg2);
    expect(fakeLobby._broadcast).toStrictEqual([
      { clientId: 'c1', message: msg1 },
      { clientId: 'c1', message: msg2 },
    ]);
    expect(leaveCount).toBe(0);

    sut.leave();
    expect(fakeLobby._broadcast).toStrictEqual([
      { clientId: 'c1', message: msg1 },
      { clientId: 'c1', message: msg2 },
    ]);
    expect(leaveCount).toBe(1);

    const msg3 = makeMsg('hello3');
    sut.broadcast(msg3);
    expect(fakeLobby._broadcast).toStrictEqual([
      { clientId: 'c1', message: msg1 },
      { clientId: 'c1', message: msg2 },
    ]);
    expect(leaveCount).toBe(1);
  });
});
