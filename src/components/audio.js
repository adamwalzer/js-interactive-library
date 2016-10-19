import { Howl } from 'howler';
import Media from './media.js';

class Audio extends Media {
  constructor() {
    super();

    this.startCount = 0;
    this.completeCount = 0;

    this.complete = this.complete.bind(this);
    this.ready = this.ready.bind(this);
    this.playAudio = this.playAudio.bind(this);
  }

  play() {
    skoash.trigger('getState').then(state => {
      if (!this.state.ready) {
        this.bootstrap();
      } else {
        skoash.trigger('audioPlay', {
          audio: this
        });
        this.delayed = true;

        if (!state.paused) {
          this.timeout = setTimeout(
            this.playAudio,
            this.props.delay
          );
        }
      }
    });
  }

  playAudio() {
    if (this.paused) return;

    this.delayed = false;
    this.playing = true;

    this.audio.play(this.sprite);
    this.startCount++;
    super.play();
  }

  pause() {
    if (this.delayed) {
      clearTimeout(this.timeout);
    }

    if (!this.playing) return;
    this.audio.pause();
    this.paused = true;
  }

  resume() {
    skoash.trigger('getState').then(state => {
      if (state.paused) return;

      if (this.delayed) {
        this.timeout = setTimeout(
          this.playAudio,
          this.props.delay
        );
      }

      if (!this.paused) return;
      this.paused = false;
      this.playAudio();
    });
  }

  stop() {
    if (this.delayed && this.timeout) {
      clearTimeout(this.timeout);
    }

    if (!this.playing && !this.delayed) return;
    if (!this.audio) return;

    skoash.trigger('audioStop', {
      audio: this
    });
    this.playing = false;
    this.paused = false;
    this.audio.stop(this.sprite);
  }

  setVolume(volume) {
    volume = Math.min(this.props.maxVolume, Math.max(this.props.minVolume, volume));
    this.audio.volume(volume);
  }

  increaseVolume(volume) {
    if (!this.playing) return;
    volume = Math.min(volume || this.props.volume, this.props.maxVolume);
    this.audio.fadeIn(volume);
  }

  decreaseVolume(volume) {
    if (!this.playing) return;
    volume = Math.max(volume, this.props.minVolume);
    this.audio.fadeOut(volume);
  }

  complete() {
    if (!this.props.loop) {
      skoash.trigger('audioStop', {
        audio: this
      });
    }

    this.completeCount++;

    if (!this.props.complete && (!this.playing || this.paused)) return;
    if (this.startCount > this.completeCount) return;

    this.playing = false;
    super.complete();
  }

  shouldComponentUpdate() {
    return false;
  }

  bootstrap() {
    var sprite;

    this.sprite = this.props.sprite ? 'sprite' : undefined;

    if (this.audio) return;

    if (this.props.sprite) {
      sprite = {
        sprite: this.props.sprite
      };
    }

    this.audio = new Howl({
      urls: [].concat(this.props.src), // switch this to src when moving to Howler ^2.0.0
      format: [].concat(this.props.format),
      loop: this.props.loop,
      volume: this.props.volume,
      onend: this.complete,
      onload: this.ready,
      sprite,
    });
    if (this.props.complete) {
      this.complete();
    }
  }
}

Audio.defaultProps = _.defaults({
  format: 'mp3',
  delay: 0,
  loop: false,
  volume: 1,
  maxVolume: 1,
  minVolume: 0,
  sprite: undefined,
}, Media.defaultProps);

export default Audio;
