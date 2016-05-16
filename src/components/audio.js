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

  pause() {
    this.audio.setPaused(true);
  }

  resume() {
    this.audio.setPaused(false);
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
    var loop, delay;

    if (!this.state.ready) {
      loop = this.props.loop ? -1 : 0;
      delay = this.props.delay ? this.props.delay : 0;
      createjs.Sound.registerSound(this.props.src, this.props.src, 4, './', {
        loop,
        delay,
      });
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
    return (
      <audio {...this.props} preload='none'></audio>
    );
  }
}

export default Audio;
