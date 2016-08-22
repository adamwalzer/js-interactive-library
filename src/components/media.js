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

Media.defaultProps = {
  type: 'div',
  shouldRender: false,
  bootstrap: false,
  checkReady: false,
  checkComplete: false,
  silentOnStart: true
};

export default Media;
