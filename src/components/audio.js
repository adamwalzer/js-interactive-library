import Asset from './asset.js';

class Audio extends Asset {
  constructor() {
    super();
  }

  play() {
    var self = this,
        delay = this.props.delay || 0;

    if (!this.state.ready) {
      this.componentDidMount();
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

    if (this.audio.playState === 'playFailed') {
      setTimeout(() => {
        self.play();
      }, 100)
    }
  }

  pause() {
    this.audio.setPaused(true);
    this.setState({
      paused: true,
    });
  }

  resume() {
    this.audio.setPaused(false);
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
    if (!this.audio || (this.audio.playState === 'playFinished')) return;
    play.trigger('audioStop', {
      audio: this
    });
    createjs.Sound.stop(this.props.src);
  }

  setVolume(value) {
    this.audio.setVolume(value);
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
    var loop;

    if (!this.state.ready) {
      loop = this.props.loop ? -1 : 0;
      createjs.Sound.registerSound(this.props.src, this.props.src, 4, './', {
        loop,
      });
      this.checkReady();
    }
  }

  checkReady() {
    if (createjs.Sound.isReady(this.props.src)) {
      this.audio = createjs.Sound.createInstance(this.props.src);
      this.audio.on('complete', this.complete, this);
      this.ready();
    } else {
      setTimeout(this.checkReady.bind(this), 100);
    }
  }

  render() {
      // <audio {...this.props} preload='none'></audio>
    return (
      null
    );
  }
}

export default Audio;
