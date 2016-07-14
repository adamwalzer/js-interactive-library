import Asset from './asset.js';

class Image extends Asset {
  constructor() {
    super();
  }

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

export default Image;
