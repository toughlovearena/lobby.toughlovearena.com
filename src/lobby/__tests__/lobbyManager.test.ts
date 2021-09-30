
import { SocketMessage } from '../../types';
import { LobbyManager } from '../lobbyManager';
import { EmptyCallback, makeMsg } from './__mocks__/testHelpers';

describe('lobbyManager', () => {
  test('register()', () => {
    const sut = new LobbyManager('signal');
    expect(sut.health().clients.length).toBe(0);

    sut.register('a', EmptyCallback);
    expect(sut.health().clients.length).toBe(1);

    sut.register('b', EmptyCallback);
    expect(sut.health().clients.length).toBe(2);

    // idempotent
    sut.register('b', EmptyCallback);
    expect(sut.health().clients.length).toBe(2);

    sut.unregister('a');
    expect(sut.health().clients.length).toBe(1);

    // idempotent
    sut.unregister('a');
    expect(sut.health().clients.length).toBe(1);
  });

  test('broadcast()', () => {
    const sut = new LobbyManager('signal');

    const aInbox: SocketMessage[] = [];
    sut.register('a', msg => aInbox.push(msg));

    const bInbox: SocketMessage[] = [];
    sut.register('b', msg => bInbox.push(msg));

    const msgB = makeMsg('b says hello');
    const msgA = makeMsg('a responds');
    sut.broadcast('b', msgB);
    expect(aInbox).toStrictEqual([msgB]);
    expect(bInbox).toStrictEqual([]);

    sut.broadcast('a', msgA);
    expect(aInbox).toStrictEqual([msgB]);
    expect(bInbox).toStrictEqual([msgA]);
  });

  test('cache old broadcasts', () => {
    const sut = new LobbyManager('signal');

    const aInbox: SocketMessage[] = [];
    sut.register('a', msg => aInbox.push(msg));

    const msgA = makeMsg('a is lonely');
    sut.broadcast('a', msgA);

    const bInbox: SocketMessage[] = [];
    sut.register('b', msg => bInbox.push(msg));

    expect(aInbox).toStrictEqual([]);
    expect(bInbox).toStrictEqual([msgA]);
  });

  test('remove broadcast history on leave', () => {
    const sut = new LobbyManager('signal');

    const msgA = makeMsg('a was here');
    const msgB = makeMsg('b came second');

    const aInbox: SocketMessage[] = [];
    sut.register('a', msg => aInbox.push(msg));
    sut.broadcast('a', msgA);

    const bInbox: SocketMessage[] = [];
    sut.register('b', msg => bInbox.push(msg));
    sut.broadcast('b', msgB);

    expect(sut.health().history).toStrictEqual([
      { clientId: 'a', message: msgA, },
      { clientId: 'b', message: msgB, },
    ]);
    sut.unregister('a');
    expect(sut.health().history).toStrictEqual([
      { clientId: 'b', message: msgB, },
    ]);
  });
});
