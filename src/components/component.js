import classNames from 'classnames';

class Component extends React.Component {
  constructor() {
    super();

    this.state = {
      started: false,
      ready: false,
    };

    this.onReady = this.onReady || _.noop;
    this.start = _.throttle(this.start.bind(this), 100);
    this.complete = _.throttle(this.complete.bind(this), 100);
  }

  complete() {
    if (!this.state || !this.state.ready) return;
    setTimeout(() => {
      this.setState({
        complete: true,
      }, () => {
        skoash.trigger('complete');
        this.props.onComplete.call(this, this);
      });
    }, this.props.completeDelay);
  }

  incomplete() {
    if (!this.state.complete || this.props.complete) return;

    this.setState({
      complete: false,
    }, () => {
      skoash.trigger('incomplete');
      this.props.onIncomplete.call(this, this);
    });
  }

  completeRefs() {
    _.forEach(this.refs, ref => {
      if (typeof ref.completeRefs === 'function') {
        ref.completeRefs();
      }
    });

    this.complete({silent: true});
  }

  incompleteRefs() {
    _.forEach(this.refs, ref => {
      if (typeof ref.incompleteRefs === 'function') {
        ref.incompleteRefs();
      }
    });

    this.incomplete();
  }

  ready() {
    this.setState({
      ready: true,
    }, () => {
      if (this.props.triggerReady) skoash.trigger('ready');
      if (this.state.open) this.start();
      this.onReady.call(this);
      this.props.onReady.call(this);
    });
  }

  start(callback) {
    if (!this.state || !this.state.ready || this.state.started) return;
    this.setState({
      started: true
    }, () => {
      this.checkComplete();
      _.each(this.refs, ref => {
        if (typeof ref.start === 'function') ref.start();
      });

      if (this.props.completeOnStart) this.complete();

      this.props.onStart.call(this);

      if (typeof callback === 'function') callback.call(this);
    });
  }

  stop() {
    this.setState({
      started: false
    }, () => {
      _.each(this.refs, ref => {
        if (ref && typeof ref.stop === 'function') {
          ref.stop();
        }
      });

      this.props.onStop.call(this);
    });
  }

  pause() {
    _.each(this.refs, ref => {
      if (typeof ref.pause === 'function') ref.pause();
    });

    this.props.onPause.call(this);
  }

  resume() {
    _.each(this.refs, ref => {
      if (typeof ref.resume === 'function') ref.resume();
    });

    this.props.onResume.call(this);
  }

  open() {
    this.setState({
      open: true
    }, () => {
      this.props.onOpen.call(this);
    });
  }

  close() {
    this.setState({
      open: false
    }, () => {
      this.props.onClose.call(this);
    });
  }

  componentWillMount() {
    if (this.props.completeIncorrect && !this.props.correct) {
      this.complete();
    }
  }

  componentDidMount() {
    this.bootstrap();
  }

  bootstrap() {
    var self = this;

    self.requireForReady = Object.keys(self.refs);
    self.requireForComplete = self.requireForReady.filter(key => self.refs[key].checkComplete);

    self.collectMedia();
    self.checkReady();

    self.props.onBootstrap.call(self);
  }

  collectData() {
    return this.props.collectData.call(this);
  }

  loadData() {
    if (this.metaData) return this.props.loadData.call(this, this.metaData);
  }

  collectMedia() {
    var self = this;

    self.media = {
      video: [],
      audio: {
        background: [],
        sfx: [],
        voiceOver: [],
      },
      sequence: [],
    };

    _.each(self.refs, (ref, key) => {
      if (skoash.Video && ref instanceof skoash.Video) {
        self.collectVideo(key);
      }

      if (skoash.Audio && ref instanceof skoash.Audio) {
        self.collectAudio(key);
      }

      if (skoash.MediaSequence && ref instanceof skoash.MediaSequence) {
        self.collectMediaSequence(key);
      }
    });

    // TODO: remove this after making sure components reference
    // this.media.audio and this.media.video instead of
    // this.audio and this.video directly
    self.audio = self.media.audio;
    self.video = self.media.video;
  }

  collectVideo(key) {
    if (!this.media[key]) this.media[key] = this.refs[key];
    this.media.video.push(this.refs[key]);
  }

  collectAudio(key) {
    if (!this.media[key]) this.media[key] = this.refs[key];
    if (!this.media.audio[key]) this.media.audio[key] = this.refs[key];
    if (this.refs[key].props.type) {
      this.media.audio[this.refs[key].props.type].push(this.refs[key]);
    }
  }

  collectMediaSequence(key) {
    if (!this.media[key]) this.media[key] = this.refs[key];
    this.media.sequence.push(this.refs[key]);
  }

  playMedia(path) {
    _.invoke(this.media, path + '.play');
  }

  checkReady() {
    var ready, self = this;

    if (!self.props.checkReady || (!this.props.ignoreReady && self.state.ready)) return;

    _.forEach(self.requireForReady, key => {
      if (self.refs[key] && self.refs[key].state && !self.refs[key].state.ready) {
        self.refs[key].bootstrap();
      }
    });

    ready = _.every(self.requireForReady, key => {
      return self.refs[key] && (
          !self.refs[key].state || (
            self.refs[key].state && self.refs[key].state.ready
          )
        );
    });

    if (ready) self.ready();
  }

  checkComplete() {
    var self = this, complete;

    if (!self.props.checkComplete || !self.state.ready || !self.requireForComplete) return;

    _.forEach(self.requireForComplete, key => {
      if (self.refs[key] && typeof self.refs[key].checkComplete === 'function') {
        self.refs[key].checkComplete();
      }
    });

    complete = _.every(self.requireForComplete, key => {
      if (self.refs[key] instanceof Node) {
        return true;
      }
      if (!self.refs[key] || !self.refs[key].state || (self.refs[key].state && !self.refs[key].state.complete)) {
        return false;
      }
      return true;
    });

    if (complete && !self.state.complete) {
      self.complete();
    } else if (self.state.started && !complete && self.state.complete) {
      self.incomplete();
    }
  }

  updateGameState(opts) {
    skoash.trigger('updateState', opts);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return this.props.shouldComponentUpdate.call(this, nextProps, nextState);
  }

  componentWillReceiveProps(props) {
    if (props.complete === true && props.complete !== this.props.complete) {
      this.complete();
    }

    if (props.start === true && props.start !== this.props.start) {
      this.start();
    }

    if (props.stop === true && props.stop !== this.props.stop) {
      this.stop();
    }
  }

  addClassName(className) {
    this.setState({
      className: classNames(this.state.className, className),
    });
  }

  removeClassName(className) {
    this.setState({
      className: this.state.className.replace(className, ''),
    });
  }

  getClassNames() {
    return classNames({
      READY: this.state.ready,
      STARTED: this.state.started,
      COMPLETE: this.state.complete,
      OPEN: this.state.open,
    }, this.state.className, this.props.className, this.props.getClassNames.call(this));
  }

  renderContentList(listName = 'children') {
    var children = [].concat(this.props[listName]);
    return children.map((component, key) => {
      if (!component) return;
      var ref = component.ref || (component.props && component.props['data-ref']) || listName + '-' + key;
      return (
        <component.type
          gameState={this.props.gameState}
          {...component.props}
          ref={ref}
          key={key}
        />
      );
    });
  }

  render() {
    if (!this.props.shouldRender) return null;

    return (
      <this.props.type {...this.props} className={this.getClassNames()}>
        {this.renderContentList()}
      </this.props.type>
    );
  }
}

Component.defaultProps = {
  bootstrap: true,
  checkComplete: true,
  checkReady: true,
  collectData: _.noop,
  completeDelay: 0,
  completeIncorrect: false,
  completeOnStart: false,
  getClassNames: _.noop,
  ignoreReady: false,
  loadData: _.noop,
  onBootstrap: _.noop,
  onClose: _.noop,
  onComplete: _.noop,
  onReady: _.noop,
  onIncomplete: _.noop,
  onOpen: _.noop,
  onPause: _.noop,
  onResume: _.noop,
  onStart: _.noop,
  onStop: _.noop,
  shouldComponentUpdate: () => true,
  shouldRender: true,
  triggerReady: true,
  type: 'div',
};

export default Component;
