import _ from 'lodash';
import classNames from 'classnames';

class Component extends React.Component {
  constructor() {
    super();

    this.state = {
      started: false,
      ready: false,
    };
  }

  complete() {
    this.setState({
      complete: true,
    }, () => {
      skoash.trigger('complete');
    });

    if (typeof this.props.onComplete === 'function') {
      this.props.onComplete(this);
    }
  }

  incomplete() {
    this.setState({
      complete: false,
    }, () => {
      skoash.trigger('incomplete');
    });
  }

  ready() {
    this.setState({
      ready: true,
    });
  }

  start() {
    this.setState({
      started: true
    }, () => {
      this.checkComplete();
    });

    _.each(this.refs, ref => {
      if (typeof ref.start === 'function') ref.start();
    });
  }

  stop() {
    this.setState({
      started: false
    });

    _.each(this.refs, ref => {
      if (ref && typeof ref.stop === 'function') {
        ref.stop();
      }
    });
  }

  pause() {
    if (typeof this.props.onPause === 'function') {
      this.props.onPause(this);
    }

    _.each(this.refs, ref => {
      if (typeof ref.pause === 'function') ref.pause();
    });
  }

  resume() {
    if (typeof this.props.onResume === 'function') {
      this.props.onResume(this);
    }

    _.each(this.refs, ref => {
      if (typeof ref.resume === 'function') ref.resume();
    });
  }

  open() {
    this.setState({
      open: true
    });
  }

  close() {
    this.setState({
      open: false
    });
  }

  componentDidMount() {
    this.bootstrap();
  }

  bootstrap() {
    var self = this;
    this.requireForReady = Object.keys(self.refs);
    this.requireForComplete = this.requireForReady.filter(key => {
      return self.refs[key].checkComplete;
    });

    this.collectMedia();
    this.checkReady();

    // this seems to duplicate a lot of data
    // let's think more about this before adding this code
    // this.setState(this.props);
  }

  collectData() {
    if (typeof this.props.collectData === 'function') {
      return this.props.collectData.call(this);
    }
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

    if (!this.props.checkReady) return;

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
    } else {
      setTimeout(self.checkReady.bind(self), 100);
    }
  }

  checkComplete() {
    var self = this, complete;

    if (!self.props.checkComplete || !self.requireForComplete) return;

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

  getClassNames() {
    return classNames({
      READY: this.state.ready,
      STARTED: this.state.started,
      COMPLETE: this.state.complete,
      OPEN: this.state.open,
    }, this.props.className);
  }

  renderContentList(listName) {
    var children = [].concat(this.props[listName || 'children']);
    return children.map((component, key) => {
      if (!component) return;
      var ref = component.ref || component.props['data-ref'] || key;
      return (
        <component.type
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
  type: 'div',
  shouldRender: true,
  checkComplete: true,
  checkReady: true,
};

export default Component;
