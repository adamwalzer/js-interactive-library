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
      createjs.Sound.play(this.props.src)
        .on('complete', this.complete, this);
    }
  }

  stop() {
    createjs.Sound.stop(this.props.src);
  }

  componentDidMount() {
    createjs.Sound.registerSound(this.props.src, this.props.src);
    this.checkReady();
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
