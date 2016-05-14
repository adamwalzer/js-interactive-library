import Asset from './asset.js';

class Audio extends Asset {
  constructor() {
    super();
  }

  play() {
    createjs.Sound.play(this._reactInternalInstance._rootNodeID)
      .on('complete', this.complete, this);
  }

  stop() {
    createjs.Sound.stop(this._reactInternalInstance._rootNodeID);
  }

  componentDidMount() {
    createjs.Sound.registerSound(this.props.src, this._reactInternalInstance._rootNodeID);
    this.checkReady();
  }

  checkReady() {
    if (createjs.Sound.isReady(this._reactInternalInstance._rootNodeID)) {
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
