import Component from './component.js';

/*
 * the Asset class is meant for all assets
 * for example images, and media (audio, video)
 */
class Asset extends Component {}

Asset.defaultProps = _.defaults({
  checkComplete: false,
  checkReady: false,
}, Component.defaultProps);

export default Asset;
