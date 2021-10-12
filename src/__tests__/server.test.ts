import { Server } from '../server';

describe('Server', () => {
  test('greenblue.json should be a valid branch', () => {
    const { branch, port } = Server.readConfig();
    expect(['lobbya', 'lobbyb']).toContain(branch);
    expect([2401, 2402]).toContain(port);
  });
});
