import Asset from './asset.js';

class Image extends Asset {
  constructor() {
    super();
  }

  render() {
    return (
      <img width="100px" onLoad={this.ready.bind(this)} className={this.props.className} src={this.props.src} draggable={false} />
    );
  }
}

export default Image;
