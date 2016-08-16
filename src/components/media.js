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
}, Asset.defaultProps);

export default Media;
