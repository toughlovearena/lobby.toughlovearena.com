import { BroadcastMods, MessageType, SignalCallback, SocketMessage } from '../../types';
import { LobbyManager, LobbyRegistrationArgs } from '../lobbyManager';
import { EmptyCallback, genUploadMod } from './__mocks__/testHelpers';

describe('lobbyManager', () => {
  function genLobbyRegistrationArgs(slug: string, cb?: SignalCallback<SocketMessage>): LobbyRegistrationArgs {
    return {
      clientId: slug,
      tag: 'tag-' + slug,
      cb: cb ?? EmptyCallback,
    };
  }
  test('register()', () => {
    const sut = new LobbyManager('signal');
    expect(sut.health().clients.length).toBe(0);

    sut.register(genLobbyRegistrationArgs('a'));
    expect(sut.health().clients.length).toBe(1);

    sut.register(genLobbyRegistrationArgs('b'));
    expect(sut.health().clients.length).toBe(2);

    // idempotent
    sut.register(genLobbyRegistrationArgs('b'));
    expect(sut.health().clients.length).toBe(2);

    sut.unregister('a');
    expect(sut.health().clients.length).toBe(1);

    // idempotent
    sut.unregister('a');
    expect(sut.health().clients.length).toBe(1);
  });

  test('uploadMod()', () => {
    const sut = new LobbyManager('signal');

    let aInbox: SocketMessage[] = [];
    sut.register(genLobbyRegistrationArgs('a', msg => aInbox.push(msg)));
    let bInbox: SocketMessage[] = [];
    sut.register(genLobbyRegistrationArgs('b', msg => bInbox.push(msg)));
    aInbox = [];
    bInbox = [];

    const modA = genUploadMod('a makes mod').data;
    const modB = genUploadMod('b says hello').data;
    sut.uploadMod(modA);
    const broadcast1: BroadcastMods = {
      type: MessageType.BroadcastMods,
      state: [modA],
    };
    expect(aInbox).toStrictEqual([broadcast1]);
    expect(bInbox).toStrictEqual([broadcast1]);

    sut.uploadMod(modB);
    const broadcast2: BroadcastMods = {
      type: MessageType.BroadcastMods,
      state: [modA, modB],
    };
    expect(aInbox).toStrictEqual([broadcast1, broadcast2]);
    expect(bInbox).toStrictEqual([broadcast1, broadcast2]);
  });

  test('receive all state on register', () => {
    const sut = new LobbyManager('signal');

    const aInbox: SocketMessage[] = [];
    sut.register(genLobbyRegistrationArgs('a', msg => aInbox.push(msg)));
    expect(aInbox.length).toBe(3);

    const modA = genUploadMod('a makes mod').data;
    sut.uploadMod(modA);
    const broadcast1: BroadcastMods = {
      type: MessageType.BroadcastMods,
      state: [modA],
    };
    expect(aInbox.length).toBe(4);

    const bInbox: SocketMessage[] = [];
    sut.register(genLobbyRegistrationArgs('b', msg => bInbox.push(msg)));
    expect(aInbox.length).toBe(5);
    expect(bInbox.length).toBe(3);

    expect(aInbox[3]).toStrictEqual(broadcast1);
    expect(bInbox[2]).toStrictEqual(broadcast1);
  });
});
