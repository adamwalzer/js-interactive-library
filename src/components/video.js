import Asset from './asset.js';

class Video extends Asset {
  constructor() {
    super();
  }

  play() {
    if (this.state.playing) return;
    this.el.play();
    play.trigger('videoPlay', {
      video: this
    });
    this.setState({
      playing: true,
    });
  }

  start() {
    this.play();
  }

  stop() {
    this.el.pause();
    play.trigger('videoStop', {
      video: this
    });
    this.setState({
      playing: false,
    });
  }

  componentDidMount() {
    this.el = ReactDOM.findDOMNode(this);
  }

  render() {
    return (
      <video onCanPlay={this.ready.bind(this)} onEnded={this.complete.bind(this)} className={this.props.className} src={this.props.src} preload="auto" controls={true}></video>
    );
  }
}

export default Video;
