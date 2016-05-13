import Asset from './asset.js';

class Video extends Asset {
  constructor() {
    super();
  }

  play() {
    this.el.play();
  }

  componentDidMount() {
    this.el = ReactDOM.findDOMNode(this);
  }

  render() {
    return (
      <video onLoad={this.ready.bind(this)} onEnded={this.complete.bind(this)} className={this.props.className} src={this.props.src} preload='auto' controls></video>
    );
  }
}

export default Video;
