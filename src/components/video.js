import Component from './component.js';

class Video extends Component {
  constructor() {
    super();
  }

  render() {
    return (
      <video onLoad={this.ready.bind(this)} className={this.props.className} src={this.props.src} preload="auto"></video>
    );
  }
}

export default Video;
