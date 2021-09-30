import { LobbyRegistrar } from '../../lobby';
import { SocketMessage } from '../../types';
import { FakeTimeKeeper } from '../../__tests__/__mocks__/fakeTimeKeeper';
import { SocketContainer } from '../socket';
import { FakeSocket } from './__mocks__/fakeSocket';

describe('socket', () => {
  let lobbyRegistrar: LobbyRegistrar;
  let ws: FakeSocket;
  let timeKeeper: FakeTimeKeeper;
  let cleanupCount = 0;
  let sut: SocketContainer;

  function sendMessage(msg: SocketMessage) {
    ws._trigger('message', JSON.stringify(msg));
  }
  const clientId = 'c1';
  const groupId = 's1';
  const registerData: SocketMessage = {
    type: 'register',
    lobbyId: groupId,
  };
  const signalData1: SocketMessage = {
    type: 'data',
    message: 'data1',
  };
  const signalData2: SocketMessage = {
    type: 'data',
    message: 'data2',
  };
  const signalData3: SocketMessage = {
    type: 'data',
    message: 'data3',
  };
  function getGroupSnapshot() {
    return lobbyRegistrar.health().filter(g => g.signalId === groupId)[0];
  }

  beforeEach(() => {
    lobbyRegistrar = new LobbyRegistrar();
    ws = new FakeSocket();
    timeKeeper = new FakeTimeKeeper();
    cleanupCount = 0;
    sut = new SocketContainer({
      clientId,
      socket: ws._cast(),
      lobbyRegistrar: lobbyRegistrar,
      timeKeeper,
      onCleanup: () => cleanupCount++,
    });
  });

  test('invalid data causes error', () => {
    expect(() => ws._trigger('message', JSON.stringify({ type: 'register', message: 'hello' }))).not.toThrow();
    expect(() => ws._trigger('message', '')).toThrow();
    expect(() => ws._trigger('message', JSON.stringify({ type: 'badtype', message: 'hello' }))).toThrow();
  });

  test('register twice caused error', () => {
    expect(sut.health().group).toBeUndefined();
    sendMessage(registerData);
    expect(sut.health().group).toBe(groupId);
    expect(() => sendMessage(registerData)).toThrow();
  });

  test('register allows sending signals', () => {
    expect(getGroupSnapshot()).toBeUndefined();
    sendMessage(registerData);
    expect(getGroupSnapshot()).toBeTruthy();
    expect(getGroupSnapshot().history).toStrictEqual([]);
    sendMessage(signalData1);
    expect(getGroupSnapshot().history).toStrictEqual([
      { clientId, message: signalData1, },
    ]);
    sendMessage(signalData2);
    expect(getGroupSnapshot().history).toStrictEqual([
      { clientId, message: signalData1, },
      { clientId, message: signalData2, },
    ]);
  });

  test('signals sent before register are queued up', () => {
    sendMessage(signalData1);
    sendMessage(signalData2);
    expect(getGroupSnapshot()).toBeUndefined();
    sendMessage(registerData);
    expect(getGroupSnapshot()).toBeTruthy();
    expect(getGroupSnapshot().history).toStrictEqual([
      { clientId, message: signalData1, },
      { clientId, message: signalData2, },
    ]);
    sendMessage(signalData3);
    expect(getGroupSnapshot().history).toStrictEqual([
      { clientId, message: signalData1, },
      { clientId, message: signalData2, },
      { clientId, message: signalData3, },
    ]);
  });

  test('register allows receiving signals', () => {
    expect(getGroupSnapshot()).toBeUndefined();
    sendMessage(registerData);

    // setup second socket
    const ws2 = new FakeSocket();
    new SocketContainer({
      clientId: 'c2',
      socket: ws2._cast(),
      lobbyRegistrar: lobbyRegistrar,
      timeKeeper,
      onCleanup: () => { },
    });
    ws2._trigger('message', JSON.stringify(registerData));
    expect(ws._sent).toStrictEqual([]);

    ws2._trigger('message', JSON.stringify(signalData1));
    expect(ws._sent).toStrictEqual([JSON.stringify(signalData1)]);
    ws2._trigger('message', JSON.stringify(signalData2));
    expect(ws._sent).toStrictEqual([JSON.stringify(signalData1), JSON.stringify(signalData2)]);
  });

  test('close on error', () => {
    sendMessage(registerData);
    expect(ws._terminateCount).toBe(0);
    expect(cleanupCount).toBe(0);
    expect(getGroupSnapshot()).toBeTruthy();

    ws._trigger('error');
    expect(ws._terminateCount).toBe(1);
    expect(cleanupCount).toBe(1);
    expect(getGroupSnapshot()).toBeUndefined();
  });

  test('close on close', () => {
    sendMessage(registerData);
    expect(ws._terminateCount).toBe(0);
    expect(cleanupCount).toBe(0);
    expect(getGroupSnapshot()).toBeTruthy();

    ws._trigger('close');
    expect(ws._terminateCount).toBe(1);
    expect(cleanupCount).toBe(1);
    expect(getGroupSnapshot()).toBeUndefined();
  });

  test('checkAlive() closes after TTL if no update', () => {
    timeKeeper._set(0);
    sut.checkAlive();
    expect(cleanupCount).toBe(0);

    timeKeeper._set(SocketContainer.TTL);
    sut.checkAlive();
    expect(cleanupCount).toBe(0);

    timeKeeper._set(SocketContainer.TTL + 1);
    sut.checkAlive();
    expect(cleanupCount).toBe(1);
  });

  test('checkAlive() closes after TTL since last update', () => {
    timeKeeper._set(0);
    sut.checkAlive();
    expect(cleanupCount).toBe(0);

    timeKeeper._set(5);
    sendMessage(registerData);
    sut.checkAlive();
    expect(cleanupCount).toBe(0);

    timeKeeper._set(SocketContainer.TTL + 5);
    sut.checkAlive();
    expect(cleanupCount).toBe(0);

    timeKeeper._set(SocketContainer.TTL + 6);
    sut.checkAlive();
    expect(cleanupCount).toBe(1);
  });
});
