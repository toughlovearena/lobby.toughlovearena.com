import { SocketMessage } from "../types";
import { Communicator } from "./communicator";
import { Group, SignalCallback } from "./group";

export class Organizer {
  private readonly lookup: Record<string, Group> = {};

  join(args: {
    signalId: string,
    clientId: string,
    cb: SignalCallback<SocketMessage>,
  }): Communicator {
    this.lookup[args.signalId] = this.lookup[args.signalId] ?? new Group(args.signalId);
    const group = this.lookup[args.signalId];
    group.register(args.clientId, args.cb);
    return new Communicator({
      clientId: args.clientId,
      group,
      onLeave: () => this.onCommLeave({
        clientId: args.clientId,
        group,
      }),
    });
  }
  private onCommLeave(args: {
    clientId: string,
    group: Group,
  }) {
    args.group.unregister(args.clientId);
    if (args.group.isEmpty()) {
      delete this.lookup[args.group.signalId];
    }
  }

  health() {
    return Object.values(this.lookup).map(group => group.health());
  }
}
