import { Howl } from 'howler';
import Media from './media.js';

class Audio extends Media {
  constructor() {
    super();

    this.complete = this.complete.bind(this);
    this.ready = this.ready.bind(this);
  }

  play() {
    var self = this,
      delay = this.props.delay || 0,
      state = skoash.trigger('getState');

    if (!self.state.ready) {
      self.bootstrap();
      setTimeout(
        self.skoash.bind(self),
        50
      );
    } else {
      skoash.trigger('audioPlay', {
        audio: self
      });

      if (!state.paused) {
        setTimeout(
          self.playAudio.bind(self),
          delay
        );
      }
    }
  }

  playAudio() {
    if (this.state.paused) {
      return;
    }

    this.setState({
      playing: true
    });

    this.audio.play();
  }

  pause() {
    if (!this.state.playing) return;
    this.audio.pause();
    this.setState({
      paused: true,
    });
  }

  resume() {
    if (!this.state.paused) return;
    this.setState(
      {
        paused: false,
      },
      this.playAudio.bind(this)
    );
  }

  stop() {
    if (!this.audio) return;
    skoash.trigger('audioStop', {
      audio: this
    });
    this.setState({
      playing: false
    });
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

    this.setState({
      playing: false
    });

    super.complete();
  }

  componentDidMount() {
    this.audio = new Howl({
      src: [this.props.src],
      loop: this.props.loop || false,
      onend: this.complete,
      onload: this.ready
    });
    if (this.props.complete) {
      this.complete();
    }
  }
}

export default Audio;
