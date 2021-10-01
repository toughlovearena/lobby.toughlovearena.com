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

  test('leave() removes empty rooms', async () => {
    const tk = new FakeTimeKeeper();
    const sut = new LobbyRegistrar(tk);
    expect(sut.health().length).toBe(0);

    const lobby = await sut.create();
    const comm1 = lobby.register(genLobbyArgs('c1'))
    const comm2 = lobby.register(genLobbyArgs('c2'));
    expect(sut.health().length).toBe(1);
    expect(sut.health()[0].clients.length).toBe(2);
    tk._increment(lobby.TTL + 1);

    comm1.leave();
    expect(sut.health().length).toBe(1);
    expect(sut.health()[0].clients.length).toBe(1);

    comm2.leave();
    expect(sut.health().length).toBe(0);
  });
});
