import Component from './component.js';

/*
 * the Asset class is meant for all assets
 * for example images, and media (audio, video)
 */
class Asset extends Component {
  bootstrap() {
    // this is to prevent the audio component from collecting it's own audio
    if (this.props.bootstrap) super.bootstrap();
  }
}

Asset.defaultProps = _.defaults({
  bootstrap: false,
  checkComplete: false,
  checkReady: false,
  shouldRender: false,
}, Component.defaultProps);

export default Asset;
