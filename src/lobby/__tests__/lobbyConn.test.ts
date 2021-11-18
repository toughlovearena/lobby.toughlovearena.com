import { LobbyPlayerStatus, MessageType, SendHostRemoveMod, SendHostUpdateSettings, SendRegister, SendUpdateStatus, SendUploadMod } from '../../types';
import { LobbyConnection } from '../lobbyConn';
import { LobbyManager } from '../lobbyManager';
import { FakeLobbyManager, genUploadMod } from './__mocks__/testHelpers';

describe('LobbyConnection', () => {
  let fakeLobby: FakeLobbyManager;
  let leaveCount: number;
  let sut: LobbyConnection;

  beforeEach(() => {
    fakeLobby = new FakeLobbyManager();
    leaveCount = 0;
    sut = new LobbyConnection({
      clientId: 'c1',
      lobby: fakeLobby as any as LobbyManager,
      onLeave: () => leaveCount++,
    });
  });

  test('handleMessage passes through to LobbyManager', () => {
    const updateStatus: SendUpdateStatus = {
      type: MessageType.SendUpdateStatus,
      status: LobbyPlayerStatus.Spectate,
    };
    sut.handleMessage(updateStatus);
    expect(fakeLobby._updateStatus).toStrictEqual([updateStatus.status]);

    const hostUpdateSettings: SendHostUpdateSettings = {
      type: MessageType.SendHostUpdateSettings,
      patch: {},
    };
    sut.handleMessage(hostUpdateSettings);
    expect(fakeLobby._hostUpdateSettings).toStrictEqual([hostUpdateSettings.patch]);

    const uploadMod: SendUploadMod = {
      type: MessageType.SendUploadMod,
      data: { modId: 'dne', configJson: 'json', },
    };
    sut.handleMessage(uploadMod);
    expect(fakeLobby._uploadMod).toStrictEqual([uploadMod.data]);

    const hostRemoveMod: SendHostRemoveMod = {
      type: MessageType.SendHostRemoveMod,
      modId: 'dne',
    };
    sut.handleMessage(hostRemoveMod);
    expect(fakeLobby._hostRemoveMod).toStrictEqual([hostRemoveMod.modId]);
  });

  test('handleMessage sends error when type is unsupported', () => {
    const badMessage: SendRegister = {
      type: MessageType.SendRegister,
      tag: 't1',
    };
    expect(() => sut.handleMessage(badMessage)).toThrow();
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
