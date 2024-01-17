# lobby.toughlovearena.com

Lobby server for ToughLoveArena

## Hosting

Lobbies currently have two virtual servers with their own URLs running on a single instance:

- https://lobbya.toughlovearena.com
- https://lobbyb.toughlovearena.com

This is to enable [Blue-Green Deployment](https://en.wikipedia.org/wiki/Blue-green_deployment). The game client will only ever point to the current stable server (this is currently a manual code change that requires a version update). This allows easy migration across breaking API changes.

- [compare a vs b](https://github.com/toughlovearena/lobby.toughlovearena.com/compare/prod-lobbya...prod-lobbyb)
- [compare b vs a](https://github.com/toughlovearena/lobby.toughlovearena.com/compare/prod-lobbyb...prod-lobbya)

## How and when to deploy

Both servers (A and B) are live at all times and continuously deploying. Whenever you push to main, CD checks [greenblue.json](src/greenblue.json) to see which branch it should deploy to. That server will detect the changes to it's branch within 5 minutes and then reboot itself. However, this is a destructive action since lobbies rely on WebSockets, so we don't want to push to a branch that's currently being used.

Therefore, the best practice for development is the following steps:

0. Assuming all of production (aka toughlovearena.com) is pointing to `lobbya` (reverse all letters if otherwise)
1. Change [greenblue.json](src/greenblue.json) to `lobbyb` to start developing
2. Push 1+ new commits to main, which will be automatically pushed to `lobbyb`
3. Test `lobbyb` using locally modified app code or a staging version (eg. Canary)
4. Once confident, update production to use `lobbyb`
5. Wait for rollout to finish and confirm that `lobbya` eventually becomes empty by checking `(url)/health`
6. Repeat at step 1, but with the a/b reversed
