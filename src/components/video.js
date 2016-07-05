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

  pause() {
    this.el.pause();
    this.setState({
      paused: true,
    });
  }

  resume() {
    this.setState({
      paused: false,
    }, this.play);
  }

  componentDidMount() {
    this.el = ReactDOM.findDOMNode(this);
  }

  render() {
    return (
      <video {...this.props} onCanPlay={this.ready.bind(this)} onEnded={this.complete.bind(this)} preload="auto" controls={true}></video>
    );
  }
}

export default Video;
