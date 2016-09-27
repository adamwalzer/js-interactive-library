import _ from 'lodash';

import Asset from './asset.js';

class Image extends Asset {
  componentDidMount() {
    this.setState({
      complete: true
    });
  }

  ready() {
    if (!this.state.error) {
      this.setState({
        ready: true,
        complete: !this.props.incomplete,
      });
    }
  }

  error() {
    this.setState({
      error: true,
      ready: false
    });
  }

  render() {
    return (
      <img {...this.props} onLoad={this.ready.bind(this)} onError={this.error.bind(this)} draggable={false} />
    );
  }
}

Image.defaultProps = _.defaults({
  shouldRender: true,
  bootstrap: true,
  checkReady: true,
}, Asset.defaultProps);

export default Image;
