# lobby.toughlovearena.com

Lobby server for ToughLoveArena

## Hosting

Lobbies currently have two virtual servers with their own URLs running on a single instance:

- https://lobbya.toughlovearena.com
- https://lobbyb.toughlovearena.com

This is to enable [Blue-Green Deployment](https://en.wikipedia.org/wiki/Blue-green_deployment). The game client will only ever point to the current stable server (this is currently a manual code change that requires a version update). This allows easy migration across breaking API changes.
