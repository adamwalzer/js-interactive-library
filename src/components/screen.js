import classNames from 'classnames';

import Component from 'components/component';

class Screen extends Component {
  constructor() {
    super();

    this.state = {
      ready: false,
      open: false,
      leave: false,
      close: true,
      complete: false,
      load: false,
    };
  }

  goto(index) {
    play.trigger('goto', {index});
  }

  load() {
    var self = this;

    if (!this.state.load) {
      this.setState({
        load: true,
        ready: false,
      }, () => {
        self.bootstrap();
      });
    }

  }

  checkCompleteOnStart() {
    return true;
  }

  start() {
    var self = this;

    this.bootstrap();

    Object.keys(this.refs).map(key => {
      if (typeof this.refs[key].start === 'function') {
        this.refs[key].start();
      }
    });

    this.startMedia();

    this.setState({
      started: true,
    }, () => {
      if (this.props.checkComplete !== false) {
        self.checkComplete();
      }
    });
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
  }

  complete() {
    Component.prototype.complete.call(this);
    play.trigger('screenComplete');
  }

  open(opts) {
    var self = this;

    this.setState({
      load: true,
      open: true,
      leave: false,
      close: false,
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
    });
  }

  renderScreen() {
    if (!this.state.load) {
      return null;
    }

    return this.renderContent();
  }

  renderContent() {
    return (
      <div>screen content</div>
    );
  }

  renderPrevButton() {
    return (
      <button className="prev-screen" onClick={this.goto.bind(this, this.props.index - 1)}></button>
    );
  }

  renderNextButton() {
    return (
      <button className="next-screen" onClick={this.goto.bind(this, this.props.index + 1)}></button>
    );
  }

  render() {
    return (
      <div id={this.state.id} className={this.getClassNames()}>
        {this.renderScreen()}
        {this.renderPrevButton()}
        {this.renderNextButton()}
      </div>
    );
  }
}

export default Screen;
