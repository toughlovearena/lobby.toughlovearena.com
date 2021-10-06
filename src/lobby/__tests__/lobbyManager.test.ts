import { BroadcastCallback, BroadcastMessage, BroadcastMods, MessageType } from '../../types';
import { FakeTimeKeeper } from '../../__tests__/__mocks__/fakeTimeKeeper';
import { LobbyManager, LobbyRegistrationArgs } from '../lobbyManager';
import { EmptyCallback, genUploadMod } from './__mocks__/testHelpers';

describe('lobbyManager', () => {
  function deepCopy(data: any) {
    return JSON.parse(JSON.stringify(data));
  }
  function genLobbyRegistrationArgs(slug: string, cb?: BroadcastCallback): LobbyRegistrationArgs {
    return {
      clientId: slug,
      tag: 'tag-' + slug,
      cb: cb ?? EmptyCallback,
    };
  }
  test('register()', () => {
    const sut = new LobbyManager('signal', new FakeTimeKeeper(), () => { });
    expect(sut.health().clients.length).toBe(0);

    const connA = sut.register(genLobbyRegistrationArgs('a'));
    expect(sut.health().clients.length).toBe(1);

    sut.register(genLobbyRegistrationArgs('b'));
    expect(sut.health().clients.length).toBe(2);

    connA.leave();
    expect(sut.health().clients.length).toBe(1);

    // idempotent
    connA.leave();
    expect(sut.health().clients.length).toBe(1);
  });

  test('register() twice errors', () => {
    const sut = new LobbyManager('signal', new FakeTimeKeeper(), () => { });
    expect(sut.health().clients.length).toBe(0);

    sut.register(genLobbyRegistrationArgs('a'));
    expect(sut.health().clients.length).toBe(1);

    expect(() => sut.register(genLobbyRegistrationArgs('a'))).toThrow();
  });

  test('uploadMod()', () => {
    const sut = new LobbyManager('signal', new FakeTimeKeeper(), () => { });

    let aInbox: BroadcastMessage[] = [];
    sut.register(genLobbyRegistrationArgs('a', msg => aInbox.push(deepCopy(msg))));
    let bInbox: BroadcastMessage[] = [];
    sut.register(genLobbyRegistrationArgs('b', msg => bInbox.push(deepCopy(msg))));
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
    const sut = new LobbyManager('signal', new FakeTimeKeeper(), () => { });

    const aInbox: BroadcastMessage[] = [];
    sut.register(genLobbyRegistrationArgs('a', msg => aInbox.push(msg)));
    expect(aInbox.length).toBe(4);

    const modA = genUploadMod('a makes mod').data;
    sut.uploadMod(modA);
    const broadcast1: BroadcastMods = {
      type: MessageType.BroadcastMods,
      state: [modA],
    };
    expect(aInbox.length).toBe(5);

    const bInbox: BroadcastMessage[] = [];
    sut.register(genLobbyRegistrationArgs('b', msg => bInbox.push(msg)));
    expect(aInbox.length).toBe(6);
    expect(bInbox.length).toBe(4);

    expect(aInbox[4]).toStrictEqual(broadcast1);
    expect(bInbox[2]).toStrictEqual(broadcast1);
  });
});
