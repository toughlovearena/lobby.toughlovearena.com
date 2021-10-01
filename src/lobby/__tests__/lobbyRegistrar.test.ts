import { LobbyRegistrar, LobbyRegistrarJoinArgs } from '..';
import { BroadcastCallback } from '../../types';
import { EmptyCallback } from './__mocks__/testHelpers';

describe('lobbyRegistrar', () => {
  function genLobbyRegistrarJoinArgs(lid: string, slug: string, cb?: BroadcastCallback): LobbyRegistrarJoinArgs {
    return {
      lobbyId: lid,
      clientId: slug,
      tag: 'tag-' + slug,
      cb: cb ?? EmptyCallback,
    };
  }
  test('join() is idempotent', () => {
    const sut = new LobbyRegistrar();
    expect(sut.health().length).toBe(0);

    sut.join(genLobbyRegistrarJoinArgs('a', 'c1'));
    expect(sut.health().length).toBe(1);
    sut.join(genLobbyRegistrarJoinArgs('b', 'c2'));
    expect(sut.health().length).toBe(2);
    sut.join(genLobbyRegistrarJoinArgs('a', 'c3'));
    expect(sut.health().length).toBe(2);
  });

  test('leave() removes empty rooms', () => {
    const sut = new LobbyRegistrar();
    expect(sut.health().length).toBe(0);
    const comm1 = sut.join(genLobbyRegistrarJoinArgs('a', 'c1'));
    const comm2 = sut.join(genLobbyRegistrarJoinArgs('a', 'c2'));
    expect(sut.health().length).toBe(1);
    expect(sut.health()[0].clients.length).toBe(2);

    comm1.leave();
    expect(sut.health().length).toBe(1);
    expect(sut.health()[0].clients.length).toBe(1);

    comm2.leave();
    expect(sut.health().length).toBe(0);
  });
});
