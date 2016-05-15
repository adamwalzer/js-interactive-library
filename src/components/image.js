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
      });
    }
  }

  error() {
    console.log("error");
    this.setState({
      error: true,
      ready: false
    });
  }

  render() {
    var self = this;
    return (
      <img onLoad={this.ready.bind(this)} onError={this.error.bind(this)} className={this.props.className} src={this.props.src} draggable={false} />
    );
  }
}

export default Image;
