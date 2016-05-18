import { Howl, Howler } from 'howler';
import Asset from './asset.js';

class Audio extends Asset {
  constructor() {
    super();
  }

  play() {
    var self = this,
        delay = this.props.delay || 0;

    if (!this.state.ready) {
      this.bootstrap();
      this.play();
    } else {
      play.trigger('audioPlay', {
        audio: this
      });
      setTimeout(() => {
        self.playAudio();
      }, delay);
    }

  }

  playAudio() {
    var self = this;

    if (this.state.paused) {
      this.setState({
        playAfterResume: true,
      });
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
    this.audio.play();
    this.setState({
      paused: false,
    });

    if (this.state.playAfterResume) {
      this.playAudio();
      this.setState({
        playAfterResume: false,
      });
    }
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
    if(this.props.complete) {
      this.complete();
    }
  }

  bootstrap() {
    // this is to prevent the audio component from collecting it's own audio
  }

  shouldComponentUpdate() {
    return false;
  }

  render() {
      // <audio {...this.props} preload='none'></audio>
    return (
      null
    );
  }
}

export default Audio;
