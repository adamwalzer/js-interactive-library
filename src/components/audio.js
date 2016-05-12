import Component from './component.js';

class Audio extends Component {
  constructor() {
    super();
  }

  render() {
    return (
      <audio onLoad={this.ready.bind(this)} className={this.props.className} src={this.props.src} preload="auto"></audio>
    );
  }
}

export default Audio;
