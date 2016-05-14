import Asset from './asset.js';
import Component from './component.js';

class Video extends Asset {
  constructor() {
    super();
  }

  play() {
    this.el.play();
  }

  stop() {
    this.el.pause();
  }

  componentDidMount() {
    this.el = ReactDOM.findDOMNode(this);
  }

  render() {
    var self = this;
    return (
      <video onCanPlay={() => {self.ready()}} onEnded={() => {self.complete()}} className={this.props.className} src={this.props.src} preload='auto' controls={true}></video>
    );
  }
}

export default Video;
