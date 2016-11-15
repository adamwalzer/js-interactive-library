import Asset from './asset.js';

class Image extends Asset {
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
    this.setState({
      complete: this.props.complete
    });
  }

  render() {
    return (
      <img {...this.props} onLoad={this.ready} onError={this.error} draggable={false} />
    );
  }
}

Image.defaultProps = _.defaults({
  complete: true,
}, Asset.defaultProps);

export default Image;
