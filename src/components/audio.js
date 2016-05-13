import Asset from './asset.js';

class Audio extends Asset {
  constructor() {
    super();
  }

  play() {
    createjs.Sound.play(this._reactInternalInstance._rootNodeID);
  }

  componentDidMount() {
    this.audio = createjs.Sound.registerSound(this.props.src, this._reactInternalInstance._rootNodeID);

    this.checkReady();
  }

  checkReady() {
    if (createjs.Sound.isReady(this.audio)) {
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
