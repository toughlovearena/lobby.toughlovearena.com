import { LobbyRegistrar } from '../../lobby';
import { BroadcastMods, ClientMessage, MessageType, SendRegister, SendUploadMod } from '../../types';
import { FakeTimeKeeper } from '../../__tests__/__mocks__/fakeTimeKeeper';
import { SocketContainer } from '../socket';
import { FakeSocket } from './__mocks__/fakeSocket';

describe('socket', () => {
  let lobbyRegistrar: LobbyRegistrar;
  let ws: FakeSocket;
  let timeKeeper: FakeTimeKeeper;
  let cleanupCount = 0;
  let sut: SocketContainer;

  function sendMessage(msg: ClientMessage) {
    ws._trigger('message', JSON.stringify(msg));
  }
  const clientId = 'c1';
  const lobbyId = 's1';
  const registerData: SendRegister = {
    type: MessageType.SendRegister,
    lobbyId: lobbyId,
    tag: 'tag1',
  };
  const signalData1: SendUploadMod = {
    type: MessageType.SendUploadMod,
    data: { modId: 'id1', configJson: 'data1', },
  };
  const signalData2: SendUploadMod = {
    type: MessageType.SendUploadMod,
    data: { modId: 'id2', configJson: 'data2', },
  };
  const signalData3: SendUploadMod = {
    type: MessageType.SendUploadMod,
    data: { modId: 'id3', configJson: 'data3', },
  };
  function getLobbySnapshot() {
    return lobbyRegistrar.health().filter(g => g.lobbyId === lobbyId)[0];
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
    expect(() => ws._trigger('message', JSON.stringify({ type: 'dne', message: 'hello' }))).not.toThrow();
    expect(() => ws._trigger('message', '')).toThrow();
  });

  test('register twice caused error', () => {
    expect(sut.health().group).toBeUndefined();
    sendMessage(registerData);
    expect(sut.health().group).toBe(lobbyId);
    expect(() => sendMessage(registerData)).toThrow();
  });

  test('register allows sending signals', () => {
    expect(getLobbySnapshot()).toBeUndefined();
    sendMessage(registerData);
    expect(getLobbySnapshot()).toBeTruthy();
    expect(getLobbySnapshot().state.mods).toStrictEqual([]);
    sendMessage(signalData1);
    expect(getLobbySnapshot().state.mods).toStrictEqual([
      signalData1.data,
    ]);
    sendMessage(signalData2);
    expect(getLobbySnapshot().state.mods).toStrictEqual([
      signalData1.data,
      signalData2.data,
    ]);
  });

  test('signals sent before register are queued up', () => {
    sendMessage(signalData1);
    sendMessage(signalData2);
    expect(getLobbySnapshot()).toBeUndefined();
    sendMessage(registerData);
    expect(getLobbySnapshot()).toBeTruthy();
    expect(getLobbySnapshot().state.mods).toStrictEqual([
      signalData1.data,
      signalData2.data,
    ]);
    sendMessage(signalData3);
    expect(getLobbySnapshot().state.mods).toStrictEqual([
      signalData1.data,
      signalData2.data,
      signalData3.data,
    ]);
  });

  test('register allows receiving signals', () => {
    const broadcast1: BroadcastMods = {
      type: MessageType.BroadcastMods,
      state: [signalData1.data],
    };
    const broadcast2: BroadcastMods = {
      type: MessageType.BroadcastMods,
      state: [signalData1.data, signalData2.data],
    };

    expect(getLobbySnapshot()).toBeUndefined();
    sendMessage(registerData);
    expect(ws._sent.length).toEqual(3);

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
    expect(ws._sent.length).toEqual(4);
    expect(ws2._sent.length).toEqual(3);
    ws2._trigger('message', JSON.stringify(signalData1));
    expect(ws._sent.slice(4)).toStrictEqual([JSON.stringify(broadcast1)]);
    expect(ws2._sent.slice(3)).toStrictEqual([JSON.stringify(broadcast1)]);
    ws2._trigger('message', JSON.stringify(signalData2));
    expect(ws._sent.slice(4)).toStrictEqual([JSON.stringify(broadcast1), JSON.stringify(broadcast2)]);
    expect(ws2._sent.slice(3)).toStrictEqual([JSON.stringify(broadcast1), JSON.stringify(broadcast2)]);
  });

  test('close on error', () => {
    sendMessage(registerData);
    expect(ws._terminateCount).toBe(0);
    expect(cleanupCount).toBe(0);
    expect(getLobbySnapshot()).toBeTruthy();

    ws._trigger('error');
    expect(ws._terminateCount).toBe(1);
    expect(cleanupCount).toBe(1);
    expect(getLobbySnapshot()).toBeUndefined();
  });

  test('close on close', () => {
    sendMessage(registerData);
    expect(ws._terminateCount).toBe(0);
    expect(cleanupCount).toBe(0);
    expect(getLobbySnapshot()).toBeTruthy();

    ws._trigger('close');
    expect(ws._terminateCount).toBe(1);
    expect(cleanupCount).toBe(1);
    expect(getLobbySnapshot()).toBeUndefined();
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
