import FontFaceObserver from 'fontfaceobserver';

import Asset from './asset.js';

class Font extends Asset {
  constructor(props) {
    super(props);

    this.ready = this.ready.bind(this);
    this.error = this.error.bind(this);
  }

  error() {
    this.setState({
      error: true,
      ready: false
    });
  }

  bootstrap() {
    this.font = new FontFaceObserver(this.props.name);
    this.font.load().then(this.ready).catch(this.error);

    if (this.props.complete) this.complete();
  }
}

Font.defaultProps = _.defaults({
  complete: true,
  shouldRender: false,
}, Asset.defaultProps);

export default Font;
