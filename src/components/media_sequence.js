import Media from './media.js';

class MediaSequence extends Media {
  constructor() {
    super();

    this.playNext = this.playNext.bind(this);
  }

  start() {
    if (!this.props.silentOnStart) this.play();
  }

  play() {
    this.setState({
      started: true
    });

    if (this.refs[0]) {
      this.playingIndex = 0;
      this.refs[0].play();
    }

    if (this.props.checkComplete !== false) {
      this.checkComplete();
    }
  }

  playNext() {
    var next = this.refs[++this.playingIndex];
    if (next) next.play();
  }

  renderContentList() {
    var self = this, children = [].concat(this.props.children);
    return children.map((component, key) =>
      <component.type
        {...component.props}
        ref={key}
        key={key}
        onComplete={function() {
          self.playNext();
          if (typeof component.props.onComplete === 'function') component.props.onComplete.call(this, this);
        }}
      />
    );
  }
}

MediaSequence.defaultProps = {
  type: 'div',
  shouldRender: true,
  bootstrap: true,
  checkReady: true,
  checkComplete: true,
  silentOnStart: false,
};

export default MediaSequence;
