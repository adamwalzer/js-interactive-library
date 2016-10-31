import Component from './component.js';

/*
 * the Asset class is meant for all assets
 * for example images, and media (audio, video)
 */
class Asset extends Component {}

Asset.defaultProps = _.defaults({
  bootstrap: false,
  checkComplete: false,
  checkReady: false,
  shouldRender: false,
}, Component.defaultProps);

export default Asset;
