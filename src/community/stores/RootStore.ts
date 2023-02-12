import Player from "../../common/player"
import AdbObject from "../../main/components/Navigation/AdbButton"
import { SoundFontSynth } from "../../main/services/SoundFontSynth"
import { AuthStore } from "../../main/stores/AuthStore"
import { CommunitySongStore } from "./CommunitySongStore"
import { SongStore } from "./SongStore"

export default class RootStore {
  readonly songStore = new SongStore()
  readonly authStore = new AuthStore()
  readonly communitySongStore = new CommunitySongStore()
  readonly player: Player
  readonly synth: SoundFontSynth
  adbObject: AdbObject

  constructor() {
    const context = new (window.AudioContext || window.webkitAudioContext)()

    this.synth = new SoundFontSynth(
      context,
      "https://cdn.jsdelivr.net/gh/ryohey/signal@4569a31/public/A320U.sf2"
    )

    const dummySynth = {
      activate() {},
      sendEvent() {},
    }

    const dummyTrackMute = {
      shouldPlayTrack: () => true,
    }

    // This will never be used, but it's required to instantiate the Player
    // Figure out a better way to do this
    this.adbObject = new AdbObject()

    this.player = new Player(
      this.synth,
      dummySynth,
      dummyTrackMute,
      this.songStore,
      this.adbObject
    )
  }
}
