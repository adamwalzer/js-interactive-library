import _ from 'lodash';

import { Howl } from 'howler';
import Media from './media.js';

class Audio extends Media {
  constructor() {
    super();

    this.complete = this.complete.bind(this);
    this.ready = this.ready.bind(this);
  }

  play() {
    var state = skoash.trigger('getState');

    if (!this.state.ready) {
      this.bootstrap();
    } else {
      skoash.trigger('audioPlay', {
        audio: this
      });
      this.delayed = true;

      if (!state.paused) {
        this.timeout = setTimeout(
          this.playAudio.bind(this),
          this.props.delay
        );
      }
    }
  }

  playAudio() {
    if (this.paused) return;

    this.delayed = false;
    this.playing = true;

    this.audio.play();
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
    if (this.delayed) {
      this.timeout = setTimeout(
        this.playAudio.bind(this),
        this.props.delay
      );
    }

    if (!this.paused) return;
    this.paused = false;
    this.playAudio();
  }

  stop() {
    if (!this.audio) return;
    skoash.trigger('audioStop', {
      audio: this
    });
    this.playing = false;
    this.audio.stop();
  }

  setVolume(value) {
    this.audio.volume(value);
  }

  increaseVolume(value) {
    this.audio.fadeIn(value);
  }

  decreaseVolume(value) {
    this.audio.fadeOut(value);
  }

  complete() {
    if (!this.props.loop) {
      skoash.trigger('audioStop', {
        audio: this
      });
    }

    this.playing = false;
    super.complete();
  }

  bootstrap() {
    this.audio = new Howl({
      src: [].concat(this.props.src),
      loop: this.props.loop,
      onend: this.complete,
      onload: this.ready
    });
    if (this.props.complete) {
      this.complete();
    }
  }
}

Audio.defaultProps = _.defaults({
  delay: 0,
  loop: false,
}, Media.defaultProps);

export default Audio;
