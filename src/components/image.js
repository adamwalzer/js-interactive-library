import Asset from './asset.js';

class Image extends Asset {
  constructor() {
    super();
  }

  render() {
    var self = this;
    return (
      <img width="100px" onLoad={() => {self.ready()}} className={this.props.className} src={this.props.src} draggable={false} />
    );
  }
}

export default Image;
