import { Howl } from 'howler';
import Asset from './asset.js';

class Audio extends Asset {
  constructor() {
    super();
  }

  play() {
    var self = this,
      delay = this.props.delay || 0,
      state = play.trigger('getState');

    if (!self.state.ready) {
      self.bootstrap();
      setTimeout(
        self.play.bind(self),
        50
      );
    } else {
      play.trigger('audioPlay', {
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

    this.audio.play();
  }

  pause() {
    this.audio.pause();
    this.setState({
      paused: true,
    });
  }

  resume() {
    this.setState(
      {
        paused: false,
      },
      this.playAudio.bind(this)
    );
  }

  stop() {
    if (!this.audio) return;
    play.trigger('audioStop', {
      audio: this
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
    play.trigger('audioStop', {
      audio: this
    });
    this.setState({
      complete: true,
    });
  }

  componentDidMount() {
    this.audio = new Howl({
      urls: [this.props.src],
      loop: this.props.loop || false,
      onend: this.complete.bind(this),
      onload: this.ready.bind(this)
    });
    if (this.props.complete) {
      this.complete();
    }
  }

  render() {
      // <audio {...this.props} preload='none'></audio>
    return null;
  }
}

export default Audio;
