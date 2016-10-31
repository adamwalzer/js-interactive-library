import classNames from 'classnames';

import Component from 'components/component';

class Screen extends Component {
  constructor(props) {
    super(props);

    this.state = {
      ready: false,
      open: false,
      leaving: false,
      leave: false,
      close: true,
      complete: false,
      load: false,
    };

    this.next = this.next.bind(this);
    this.prev = this.prev.bind(this);
  }

  goto(index, buttonSound) {
    if (typeof index === 'string' || typeof index === 'number') {
      skoash.trigger('goto', {
        index,
        buttonSound
      });
    } else if (typeof index === 'object') {
      index.buttonSound = index.buttonSound || buttonSound;
      skoash.trigger('goto', index);
    }
  }

  back() {
    skoash.trigger('goBack');
  }

  next() {
    var state = this.props.gameState;

    if (this.state.leaving || (!state.demo && !this.state.complete && !this.state.replay)) return;

    this.setState({
      leaving: true
    });

    setTimeout(
      this.goto.bind(this, this.props.nextIndex || this.props.index + 1, this.audio.button),
      this.props.nextDelay || 0
    );
  }

  prev() {
    this.goto(this.props.prevIndex || this.props.index - 1);
  }

  load(cb) {
    this.onReady = cb || this.onReady;
    if (!this.state.load) {
      this.setState({
        load: true,
        ready: false,
      }, () => {
        super.bootstrap();
      });
    }
  }

  bootstrap() {
    super.bootstrap();

    if (this.props.load) this.load();
  }

  replay(replay = true) {
    this.setState({
      replay,
    });
  }

  start() {
    super.start(() => {
      this.bootstrap();
      this.startMedia();
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

    if (this.props.playOnStart && this.refs[this.props.playOnStart]) {
      this.refs[this.props.playOnStart].play();
    }
  }

  complete(opts = {}) {
    super.complete(opts);
    setTimeout(() => {
      skoash.trigger('screenComplete', {
        screenID: this.props.id,
        silent: opts.silent || this.props.silentComplete
      });

      if (this.audio['screen-complete']) {
        this.audio['screen-complete'].play();
      }

      if (this.props.emitOnComplete) {
        skoash.trigger('emit', this.props.emitOnComplete);
      }
    }, this.props.completeDelay);
  }

  open(opts) {
    var self = this;

    self.setState({
      load: true,
      open: true,
      opening: true,
      leaving: false,
      leave: false,
      close: false,
      replay: this.state.complete || this.state.replay,
      opts,
    }, () => {
      if (this.props.startDelay) {
        setTimeout(() => {
          if (!self.state.started) {
            self.start();
          }
          self.setState({
            opening: false
          });
        }, this.props.startDelay);
      } else {
        if (!self.state.started) {
          self.start();
        }
        self.setState({
          opening: false
        });
      }

      this.props.onOpen.call(this);

      this.loadData();
    });
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

  collectData() {
    return this.props.collectData.call(this);
  }

  loadData() {
    return this.props.loadData.call(this);
  }

  getClassNames() {
    return classNames({
      LOAD: this.state.load,
      LEAVING: this.state.leaving,
      LEAVE: this.state.leave,
      CLOSE: this.state.close,
      REPLAY: this.state.replay,
    }, super.getClassNames(), 'screen');
  }

  renderContent() {
    return (
      <div className="screen-content">
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
    if (!this.props.hidePrev) {
      return (
        <button className="prev-screen" onClick={this.prev}></button>
      );
    }
  }

  renderNextButton() {
    if (!this.props.hideNext) {
      return (
        <button className="next-screen" onClick={this.next}></button>
      );
    }
  }

  render() {
    return (
      <div id={this.props.id} className={this.getClassNames()}>
        {this.renderScreen()}
        {this.renderPrevButton()}
        {this.renderNextButton()}
      </div>
    );
  }
}

Screen.defaultProps = _.defaults({
  resetOnClose: true,
  startDelay: 250,
  collectData: _.noop,
  loadData: _.noop,
  onOpen: _.noop,
  gameState: {},
}, Component.defaultProps);

export default Screen;
