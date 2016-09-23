import _ from 'lodash';
import classNames from 'classnames';

class Component extends React.Component {
  constructor() {
    super();

    this.state = {
      started: false,
      ready: false,
    };

    this.onReady = _.identity;
  }

  callProp(action, opts) {
    // TODO AW - 20160915
    // Let's get rid of the function and remove instances of its use in games.
    /* eslint-disable */
    console.log('Let\'s avoid using callProp in preference of using defaultProps to ensure the prop type is a function.');
    /* eslint-enable */
    if (typeof this.props[action] === 'function') {
      return this.props[action].call(this, opts);
    }
  }

  complete() {
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
    this.incomplete();

    _.forEach(this.refs, ref => {
      if (typeof ref.incompleteRefs === 'function') {
        ref.incompleteRefs();
      }
    });
  }

  ready() {
    this.setState({
      ready: true,
    }, () => {
      skoash.trigger('ready');
      this.onReady.call(this);
      this.props.onReady.call(this);
    });
  }

  start() {
    this.setState({
      started: true
    }, () => {
      this.checkComplete();
      _.each(this.refs, ref => {
        if (typeof ref.start === 'function') ref.start();
      });

      if (this.props.completeOnStart) this.complete();

      this.props.onStart.call(this);
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

  componentDidMount() {
    this.bootstrap();
  }

  bootstrap() {
    var self = this;

    if (self.props.complete) self.complete();

    self.requireForReady = Object.keys(self.refs);
    self.requireForComplete = self.requireForReady.filter(key => self.refs[key].checkComplete);

    self.collectMedia();
    self.checkReady();
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

  checkReady() {
    var ready, self = this;

    if (!self.props.checkReady || (!this.props.ignoreReady && self.state.ready)) return;

    self.requireForReady.forEach(key => {
      if (self.refs[key] && self.refs[key].state && !self.refs[key].state.ready) {
        self.refs[key].bootstrap();
      }
    });

    ready = self.requireForReady.every(key => {
      return self.refs[key] && (
          !self.refs[key].state || (
            self.refs[key].state && self.refs[key].state.ready
          )
        );
    });

    if (ready) {
      self.ready();
    }
  }

  checkComplete() {
    var self = this, complete;

    if (!self.props.checkComplete || !self.state.ready || !self.requireForComplete) return;

    self.requireForComplete.forEach(key => {
      if (self.refs[key] && typeof self.refs[key].checkComplete === 'function') {
        self.refs[key].checkComplete();
      }
    });

    complete = self.requireForComplete.every(key => {
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

  componentWillReceiveProps(props) {
    if (props.complete === true && props.complete !== this.props.complete) {
      this.complete();
    }
  }

  getClassNames() {
    return classNames({
      READY: this.state.ready,
      STARTED: this.state.started,
      COMPLETE: this.state.complete,
      OPEN: this.state.open,
    }, this.props.className, this.props.getClassNames.call(this));
  }

  renderContentList(listName = 'children') {
    var children = [].concat(this.props[listName]);
    return children.map((component, key) => {
      if (!component) return;
      var ref = component.ref || component.props['data-ref'] || listName + '-' + key;
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
  collectData: _.identity,
  completeDelay: 0,
  completeOnStart: false,
  getClassNames: _.identity,
  ignoreReady: false,
  loadData: _.identity,
  onClose: _.identity,
  onComplete: _.identity,
  onReady: _.identity,
  onIncomplete: _.identity,
  onOpen: _.identity,
  onPause: _.identity,
  onResume: _.identity,
  onStart: _.identity,
  onStop: _.identity,
  shouldRender: true,
  type: 'div',
};

export default Component;
