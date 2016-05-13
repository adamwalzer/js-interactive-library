import Asset from './asset.js';

class Audio extends Asset {
  constructor() {
    super();
  }

  play() {
    createjs.Sound.play(this._reactInternalInstance._rootNodeID);
  }

  start() {
    this.play();
  }

  ready() {
    console.log(arguments);
  }

  componentDidMount() {
    createjs.Sound.on("fileload", this.ready, this);
    createjs.Sound.registerSound(this.props.src, this._reactInternalInstance._rootNodeID);
  }

  render() {
    return null;
  }
}

export default Audio;
