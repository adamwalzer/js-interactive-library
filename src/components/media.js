import Asset from './asset.js';

/*
 * the Media class is meant for all playable assets
 * for example audio, video, and media sequences
 */
class Media extends Asset {
  start() {
    if (!this.props.silentOnStart) this.play();
  }

  play() {
    if (this.props.playTarget) {
      this.updateGameState({
        path: this.props.playTarget,
        data: {
          playing: true
        }
      });
    }
  }

  complete() {
    if (this.props.completeTarget) {
      this.updateGameState({
        path: this.props.completeTarget,
        data: {
          playing: false,
          complete: true
        }
      });
    }
    super.complete();
  }
}

Media.defaultProps = {
  type: 'div',
  shouldRender: false,
  bootstrap: false,
  checkReady: false,
  checkComplete: false,
  silentOnStart: true
};

export default Media;
