import { HostRemoveMod, HostUpdateSettings, LobbyPlayerStatus, MessageReg, MessageType, SocketMessage, UpdateStatus, UploadMod } from '../../types';
import { LobbyConnection } from '../lobbyConn';
import { LobbyManager } from '../lobbyManager';
import { FakeLobbyManager, genUploadMod } from './__mocks__/testHelpers';

describe('LobbyConnection', () => {

  let fakeLobby: FakeLobbyManager;
  let leaveCount: number;
  let inbox: SocketMessage[];
  let sut: LobbyConnection;

  beforeEach(() => {
    fakeLobby = new FakeLobbyManager();
    leaveCount = 0;
    inbox = [];
    sut = new LobbyConnection({
      clientId: 'c1',
      lobby: fakeLobby as any as LobbyManager,
      cb: sm => inbox.push(sm),
      onLeave: () => leaveCount++,
    });
  });

  test('handleMessage passes through to LobbyManager', () => {
    const updateStatus: UpdateStatus = {
      type: MessageType.UpdateStatus,
      status: LobbyPlayerStatus.Spectate,
    };
    sut.handleMessage(updateStatus);
    expect(fakeLobby._updateStatus).toStrictEqual([updateStatus.status]);

    const hostUpdateSettings: HostUpdateSettings = {
      type: MessageType.HostUpdateSettings,
      patch: {},
    };
    sut.handleMessage(hostUpdateSettings);
    expect(fakeLobby._hostUpdateSettings).toStrictEqual([hostUpdateSettings.patch]);

    const uploadMod: UploadMod = {
      type: MessageType.UploadMod,
      data: { modId: 'dne', configJson: 'json', },
    };
    sut.handleMessage(uploadMod);
    expect(fakeLobby._uploadMod).toStrictEqual([uploadMod.data]);

    const hostRemoveMod: HostRemoveMod = {
      type: MessageType.HostRemoveMod,
      modId: 'dne',
    };
    sut.handleMessage(hostRemoveMod);
    expect(fakeLobby._hostRemoveMod).toStrictEqual([hostRemoveMod.modId]);
  });

  test('handleMessage sends error when type is unsupported', () => {
    const badMessage: MessageReg = {
      type: MessageType.Register,
      lobbyId: 'l1',
      tag: 't1',
    };
    sut.handleMessage(badMessage);
    expect(inbox.length).toBe(1);
    expect(inbox[0].type).toBe(MessageType.Error);
  });

  test('handleMessage stops working after leave() is called', () => {
    expect(fakeLobby._uploadMod.length).toBe(0);
    expect(leaveCount).toBe(0);

    const msg1 = genUploadMod('hello1');
    sut.handleMessage(msg1);
    expect(fakeLobby._uploadMod).toStrictEqual([msg1.data]);
    expect(leaveCount).toBe(0);

    const msg2 = genUploadMod('hello2');
    sut.handleMessage(msg2);
    expect(fakeLobby._uploadMod).toStrictEqual([msg1.data, msg2.data]);
    expect(leaveCount).toBe(0);

    sut.leave();
    expect(fakeLobby._uploadMod).toStrictEqual([msg1.data, msg2.data]);
    expect(leaveCount).toBe(1);

    const msg3 = genUploadMod('hello3');
    sut.handleMessage(msg3);
    expect(fakeLobby._uploadMod).toStrictEqual([msg1.data, msg2.data]);
    expect(leaveCount).toBe(1);
  });
});
