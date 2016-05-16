import Asset from './asset.js';

class Audio extends Asset {
  constructor() {
    super();
  }

  play() {
    if (!createjs.Sound.isReady(this.props.src)) {
      this.componentDidMount();
      this.play();
    } else {
      play.trigger('audioPlay', {
        audio: this
      });
      this.audio = createjs.Sound.play(this.props.src);
      this.audio.on('complete', this.complete, this);
    }
  }

  stop() {
    if (!this.audio || (this.audio.playState === 'playFinished')) return;
    play.trigger('audioStop', {
      audio: this
    });
    createjs.Sound.stop(this.props.src);
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
    if (!this.state.ready) {
      createjs.Sound.registerSound(this.props.src, this.props.src);
      this.checkReady();
    }
  }

  checkReady() {
    if (createjs.Sound.isReady(this.props.src)) {
      this.ready();
    } else {
      setTimeout(this.checkReady.bind(this), 100);
    }
  }

  render() {
    return null;
  }
}

export default Audio;
