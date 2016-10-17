import _ from 'lodash';

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
    // this should be implemented per media
    // and the class that extends media should
    // call super.play() inside of its play method
    if (this.props.playTarget) {
      this.updateGameState({
        path: this.props.playTarget,
        data: {
          playing: true
        }
      });
    }

    this.props.onPlay.call(this);
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

Media.defaultProps = _.defaults({
  bootstrap: false,
  checkComplete: false,
  checkReady: false,
  shouldRender: false,
  completeDelay: 0,
  completeOnStart: false,
  silentOnStart: true,
  onPlay: _.identity,
}, Asset.defaultProps);

export default Media;
