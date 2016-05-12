import Component from './component.js';

class Image extends Component {
  constructor() {
    super();
  }

  render() {
    return (
      <img onLoad={this.ready.bind(this)} className={this.props.className} src={this.props.src} draggable={false} />
    );
  }
}

export default Image;
