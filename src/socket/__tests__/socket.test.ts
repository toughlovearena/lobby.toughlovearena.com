import { ILobbyManager, LobbyManager } from '../../lobby';
import { BroadcastMods, ClientMessage, MessageType, SendRegister, SendUploadMod } from '../../types';
import { FakeTimeKeeper } from '../../__tests__/__mocks__/fakeTimeKeeper';
import { SocketContainer } from '../socket';
import { FakeSocket } from './__mocks__/fakeSocket';

describe('socket', () => {
  let lobby: ILobbyManager;
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
    tag: 'tag1',
  };
  const signalData1: SendUploadMod = {
    type: MessageType.SendUploadMod,
    data: { modId: 'id1', filename: 'file-1', zip64: 'zip64-1', },
  };
  const signalData2: SendUploadMod = {
    type: MessageType.SendUploadMod,
    data: { modId: 'id2', filename: 'file-2', zip64: 'zip64-2', },
  };
  const signalData3: SendUploadMod = {
    type: MessageType.SendUploadMod,
    data: { modId: 'id3', filename: 'file-3', zip64: 'zip64-3', },
  };

  beforeEach(() => {
    ws = new FakeSocket();
    timeKeeper = new FakeTimeKeeper();
    lobby = new LobbyManager(lobbyId, timeKeeper, () => { });
    cleanupCount = 0;
    sut = new SocketContainer({
      clientId,
      socket: ws._cast(),
      lobby,
      timeKeeper,
      onCleanup: () => cleanupCount++,
    });
  });

  test('invalid data causes error', () => {
    expect(ws._closeCount).toBe(0);
    ws._trigger('message', JSON.stringify({ type: 'dne', message: 'hello' }));
    expect(ws._closeCount).toBe(0);
    ws._trigger('message', '');
    expect(ws._closeCount).toBe(1);
  });

  test('register twice caused error, which closes the socket', () => {
    expect(sut.health().lobbyId).toBeUndefined();
    sendMessage(registerData);
    expect(sut.health().lobbyId).toBe(lobbyId);
    expect(ws._closeCount).toBe(0);
    sendMessage(registerData);
    expect(ws._closeCount).toBe(1);
  });

  test('register allows sending signals', () => {
    expect(lobby.health().clients.length).toBe(0);
    sendMessage(registerData);
    expect(lobby.health().clients.length).toBe(1);
    expect(lobby.health().state.mods).toStrictEqual([]);
    sendMessage(signalData1);
    expect(lobby.health().state.mods).toStrictEqual([
      signalData1.data,
    ]);
    sendMessage(signalData2);
    expect(lobby.health().state.mods).toStrictEqual([
      signalData1.data,
      signalData2.data,
    ]);
  });

  test('signals sent before register are queued up', () => {
    sendMessage(signalData1);
    sendMessage(signalData2);
    expect(lobby.health().clients.length).toBe(0);
    sendMessage(registerData);
    expect(lobby.health().clients.length).toBe(1);
    expect(lobby.health().state.mods).toStrictEqual([
      signalData1.data,
      signalData2.data,
    ]);
    sendMessage(signalData3);
    expect(lobby.health().state.mods).toStrictEqual([
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

    expect(lobby.health().clients.length).toBe(0);
    sendMessage(registerData);
    expect(ws._sent.length).toEqual(4);

    // setup second socket
    const ws2 = new FakeSocket();
    new SocketContainer({
      clientId: 'c2',
      socket: ws2._cast(),
      lobby,
      timeKeeper,
      onCleanup: () => { },
    });

    ws2._trigger('message', JSON.stringify(registerData));
    expect(ws._sent.length).toEqual(5);
    expect(ws2._sent.length).toEqual(4);
    ws2._trigger('message', JSON.stringify(signalData1));
    expect(ws._sent.slice(5)).toStrictEqual([JSON.stringify(broadcast1)]);
    expect(ws2._sent.slice(4)).toStrictEqual([JSON.stringify(broadcast1)]);
    ws2._trigger('message', JSON.stringify(signalData2));
    expect(ws._sent.slice(5)).toStrictEqual([JSON.stringify(broadcast1), JSON.stringify(broadcast2)]);
    expect(ws2._sent.slice(4)).toStrictEqual([JSON.stringify(broadcast1), JSON.stringify(broadcast2)]);
  });

  test('close on error', () => {
    sendMessage(registerData);
    expect(ws._terminateCount).toBe(0);
    expect(cleanupCount).toBe(0);
    expect(lobby.health().clients.length).toBe(1);

    ws._trigger('error');
    expect(ws._terminateCount).toBe(1);
    expect(cleanupCount).toBe(1);
    expect(lobby.health().clients.length).toBe(0);
  });

  test('close on close', () => {
    sendMessage(registerData);
    expect(ws._terminateCount).toBe(0);
    expect(cleanupCount).toBe(0);
    expect(lobby.health().clients.length).toBe(1);

    ws._trigger('close');
    expect(ws._terminateCount).toBe(1);
    expect(cleanupCount).toBe(1);
    expect(lobby.health().clients.length).toBe(0);
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
