import Media from './media.js';

class Video extends Media {
  constructor() {
    super();
  }

  play() {
    if (this.state.playing) return;
    this.el.play();
    super.play();
    skoash.trigger('videoPlay', {
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
    skoash.trigger('videoStop', {
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
    }, this.skoash.bind(this));
  }

  complete() {
    if (!this.props.loop) {
      skoash.trigger('videoStop', {
        video: this
      });
    }

    this.setState({
      playing: false
    });

    super.complete();
  }

  componentDidMount() {
    this.el = ReactDOM.findDOMNode(this);
  }

  render() {
    return (
      <video {...this.props} onCanPlay={this.ready.bind(this)} onEnded={this.complete.bind(this)} preload="auto" controls={true} />
    );
  }
}

export default Video;
