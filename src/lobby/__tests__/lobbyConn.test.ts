import { LobbyConnection } from '../lobbyConn';
import { LobbyManager } from '../lobbyManager';
import { EmptyCallback, FakeLobbyManager, genUploadMod } from './__mocks__/testHelpers';

describe('LobbyConnection', () => {
  test('handleMessage stops working after leave() is called', () => {
    const fakeLobby = new FakeLobbyManager();
    let leaveCount = 0;
    const sut = new LobbyConnection({
      clientId: 'c1',
      lobby: fakeLobby as any as LobbyManager,
      cb: EmptyCallback,
      onLeave: () => leaveCount++,
    });

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
