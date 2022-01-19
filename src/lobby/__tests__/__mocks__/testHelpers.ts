import { ILobbyManager, LobbyConnection, LobbyManagerHealth, LobbyRegistrationArgs } from "../..";
import { BroadcastCallback, LobbyInputBatch, LobbyMatchPatch, LobbyModState, LobbyPlayerStatus, MessageType, SendUploadMod, SettingsPatch } from "../../../types";

export const EmptyCallback: BroadcastCallback = () => {
  // do nothing
};

export function genUploadMod(slug: string): SendUploadMod {
  return {
    type: MessageType.SendUploadMod,
    data: {
      modId: slug,
      filename: 'filename-' + slug,
      zip64: 'zip64-' + slug,
    },
  };
}

export class FakeLobbyManager implements ILobbyManager {

  readonly _register: LobbyRegistrationArgs[] = [];
  register(args: LobbyRegistrationArgs): LobbyConnection {
    this._register.push(args);
    return null;
  }
  _isDead: boolean;
  isDead() {
    return this._isDead;
  }

  // host only
  readonly _hostUpdateStatus: any[] = [];
  hostUpdateStatus(clientId: string, toUpdate: string, status: LobbyPlayerStatus) {
    this._hostUpdateStatus.push(toUpdate);
  }
  readonly _hostKickPlayer: any[] = [];
  hostKickPlayer(clientId: string, toKick: string) {
    this._hostKickPlayer.push(toKick);
  }
  readonly _hostUpdateSettings: any[] = [];
  hostUpdateSettings(clientId: string, patch: SettingsPatch) {
    this._hostUpdateSettings.push(patch);
  }
  readonly _hostRemoveMod: any[] = [];
  hostRemoveMod(clientId: string, modId: string) {
    this._hostRemoveMod.push(modId);
  }

  // public
  readonly _handleInputBatch: any[] = [];
  handleInputBatch(batch: LobbyInputBatch) {
    this._handleInputBatch.push(batch);
  }
  readonly _updateReady: any[] = [];
  updateReady(clientId: string, isReady: boolean) {
    this._updateReady.push(isReady);
  }
  readonly _updateStatus: any[] = [];
  updateStatus(clientId: string, status: LobbyPlayerStatus) {
    this._updateStatus.push(status);
  }
  readonly _uploadMod: any[] = [];
  uploadMod(mod: LobbyModState) {
    this._uploadMod.push(mod);
  }
  readonly _patchMatch: any[] = [];
  patchMatch(patch: LobbyMatchPatch) {
    this._patchMatch.push(patch);
  }
  readonly _endMatch: any[] = [];
  endMatch(loserIds: string[]) {
    this._endMatch.push(loserIds);
  }

  health(): LobbyManagerHealth {
    throw new Error('not implemented');
  }
}
