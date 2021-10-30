import { LobbyRegistrar, LobbyRegistrationArgs } from '..';
import { BroadcastCallback } from '../../types';
import { FakeTimeKeeper } from '../../__tests__/__mocks__/fakeTimeKeeper';
import { EmptyCallback } from './__mocks__/testHelpers';

describe('lobbyRegistrar', () => {
  function genLobbyArgs(slug: string, cb?: BroadcastCallback): LobbyRegistrationArgs {
    return {
      clientId: slug,
      tag: 'tag-' + slug,
      cb: cb ?? EmptyCallback,
    };
  }

  test('create() and get()', async () => {
    const tk = new FakeTimeKeeper();
    const sut = new LobbyRegistrar(tk);
    expect(sut.health().lobbies.length).toBe(0);

    expect(sut.get('dne')).toBeUndefined();
    const created = await sut.create();
    expect(sut.health().lobbies.length).toBe(1);

    const actual = sut.get(created.lobbyId);
    expect(actual).toBeTruthy();
    expect(actual).toEqual(created);
  });

  test('checkPrune()', async () => {
    const tk = new FakeTimeKeeper();
    const sut = new LobbyRegistrar(tk);

    expect(sut.checkPrune()).toBe(0);
    expect(sut.health().lobbies.length).toBe(0);

    const created = await sut.create();
    expect(sut.health().lobbies.length).toBe(1);

    expect(sut.checkPrune()).toBe(0);
    expect(sut.health().lobbies.length).toBe(1);

    tk._increment(created.TTL);
    expect(sut.checkPrune()).toBe(0);
    expect(sut.health().lobbies.length).toBe(1);

    tk._increment(1);
    expect(sut.checkPrune()).toBe(1);
    expect(sut.health().lobbies.length).toBe(0);
  });

  test('leave() removes empty rooms', async () => {
    const tk = new FakeTimeKeeper();
    const sut = new LobbyRegistrar(tk);
    expect(sut.health().lobbies.length).toBe(0);

    const lobby = await sut.create();
    const comm1 = lobby.register(genLobbyArgs('c1'))
    const comm2 = lobby.register(genLobbyArgs('c2'));
    expect(sut.health().lobbies.length).toBe(1);
    expect(sut.health().lobbies[0].clients.length).toBe(2);
    tk._increment(lobby.TTL + 1);

    comm1.leave();
    expect(sut.health().lobbies.length).toBe(1);
    expect(sut.health().lobbies[0].clients.length).toBe(1);

    comm2.leave();
    expect(sut.health().lobbies.length).toBe(0);
  });
});
