import classNames from 'classnames';

import Component from 'components/component';

class Screen extends Component {
  constructor() {
    super();

    this.state = {
      ready: false,
      open: false,
      leaving: false,
      leave: false,
      close: true,
      complete: false,
      load: false,
    };
  }

  goto(index) {
    if (typeof index === 'string' || typeof index === 'number') {
      skoash.trigger('goto', {index});
    } else if (typeof index === 'object') {
      skoash.trigger('goto', index);
    }
  }

  back() {
    skoash.trigger('goBack');
  }

  next() {
    this.setState({
      leaving: true
    });
    setTimeout(
      this.goto.bind(this, this.props.nextIndex || this.props.index + 1),
      this.props.nextDelay || 0
    );
  }

  prev() {
    this.goto(this.props.prevIndex || this.props.index - 1);
  }

  load() {
    var self = this;

    if (!self.state.load) {
      self.setState({
        load: true,
        ready: false,
      }, () => {
        self.bootstrap();
      });
    }

  }

  start() {
    var self = this;

    self.bootstrap();

    Object.keys(this.refs).map(key => {
      if (typeof this.refs[key].start === 'function') {
        this.refs[key].start();
      }
    });

    self.startMedia();

    self.setState({
      started: true,
    });

    if (self.props.checkComplete !== false) {
      self.checkComplete();
    }

    if (typeof self.props.completeDelay === 'number') {
      setTimeout(() => {
        self.complete();
      }, self.props.completeDelay);
    }
  }

  startMedia() {
    if (this.video[0]) {
      this.video[0].play();
    } else if (this.audio.voiceOver[0]) {
      this.audio.voiceOver[0].play();
    }

    if (this.audio.start) {
      this.audio.start.play();
    }

    if (this.props.playOnStart && this.refs[this.props.playOnStart]) {
      this.refs[this.props.playOnStart].play();
    }
  }

  complete() {
    Component.prototype.complete.call(this);
    skoash.trigger('screenComplete');
    if (this.props.emitOnComplete) {
      skoash.trigger('emit', this.props.emitOnComplete);
    }
  }

  open(opts) {
    var self = this;

    self.setState({
      load: true,
      open: true,
      leaving: false,
      leave: false,
      close: false,
      return: this.state.complete,
      opts,
    });

    setTimeout(() => {
      if (!self.state.started) {
        self.start();
      }
    }, 250);
  }

  leave() {
    this.setState({
      open: false,
      leave: true,
      close: false,
    });
    this.stop();
  }

  close() {
    this.setState({
      open: false,
      leave: false,
      close: true,
    });
    this.stop();
  }

  getClassNames() {
    return classNames({
      screen: true,
      READY: this.state.ready,
      LOAD: this.state.load,
      OPEN: this.state.open,
      LEAVING: this.state.leaving,
      LEAVE: this.state.leave,
      CLOSE: this.state.close,
      COMPLETE: this.state.complete,
      RETURN: this.state.return,
    });
  }

  renderContent() {
    return (
      <div>
        {this.renderContentList()}
      </div>
    );
  }

  renderScreen() {
    if (!this.state.load) {
      return null;
    }

    return this.renderContent();
  }

  renderPrevButton() {
    if (this.props.showPrev !== false) {
      return (
        <button className="prev-screen" onClick={this.prev.bind(this)}></button>
      );
    }
  }

  renderNextButton() {
    if (this.props.showNext !== false) {
      return (
        <button className="next-screen" onClick={this.next.bind(this)}></button>
      );
    }
  }

  render() {
    return (
      <div id={this.props.id || this.state.id} className={this.getClassNames()}>
        {this.renderScreen()}
        {this.renderPrevButton()}
        {this.renderNextButton()}
      </div>
    );
  }
}

export default Screen;
