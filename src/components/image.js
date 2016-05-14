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

  render() {
    var self = this;
    return (
      <img onLoad={() => {self.ready()}} className={this.props.className} src={this.props.src} draggable={false} />
    );
  }
}

export default Image;
