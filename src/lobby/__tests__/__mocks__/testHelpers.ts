import { LobbyModState, LobbyPlayerStatus, MessageType, SendUploadMod, SettingsPatch, SignalCallback } from "../../../types";
import { ILobbyManager, LobbyManagerHealth, LobbyRegistrationArgs } from "../../lobbyManager";

export const EmptyCallback: SignalCallback<any> = () => {
  // do nothing
};

export function genUploadMod(slug: string): SendUploadMod {
  return {
    type: MessageType.SendUploadMod,
    data: {
      modId: slug,
      configJson: 'json-' + slug,
    },
  };
}

export class FakeLobbyManager implements ILobbyManager {

  readonly _register: LobbyRegistrationArgs[] = [];
  register(args: LobbyRegistrationArgs) {
    this._register.push(args);
  }
  readonly _unregister: string[] = [];
  unregister(clientId: string) {
    this._unregister.push(clientId);
  }
  isEmpty() {
    return this._register.length === this._unregister.length;
  }

  // host only
  readonly _hostUpdateSettings: any[] = [];
  hostUpdateSettings(clientId: string, patch: SettingsPatch) {
    this._hostUpdateSettings.push(patch);
  }
  readonly _hostRemoveMod: any[] = [];
  hostRemoveMod(clientId: string, modId: string) {
    this._hostRemoveMod.push(modId);
  }

  // public
  readonly _updateStatus: any[] = [];
  updateStatus(clientId: string, status: LobbyPlayerStatus) {
    this._updateStatus.push(status);
  }
  readonly _uploadMod: any[] = [];
  uploadMod(mod: LobbyModState) {
    this._uploadMod.push(mod);
  }

  health(): LobbyManagerHealth {
    throw new Error('not implemented');
  }
}
