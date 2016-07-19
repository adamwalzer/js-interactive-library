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

  collectMedia() {
    var self = this;

    self.video = [];
    self.audio = {
      background: [],
      sfx: [],
      voiceOver: [],
    };

    _.each(self.refs, (ref, key) => {
      if (play.Video && ref instanceof play.Video) {
        self.collectVideo(key);
      }

      if (play.Audio && ref instanceof play.Audio) {
        self.collectAudio(key);
      }
    });
  }

  collectVideo(key) {
    this.video.push(this.refs[key]);
  }

  collectAudio(key) {
    this.audio[key] = this.refs[key];
    if (this.refs[key].props.type) {
      this.audio[this.refs[key].props.type].push(this.refs[key]);
    }
  }

  checkReady() {
    var self = this;

    self.requireForReady = this.requireForReady.filter((key) => {
      if (self.refs[key].state && !self.refs[key].state.ready) {
        self.refs[key].bootstrap();
        return true;
      }
      return false;
    });

    if (!self.requireForReady.length) {
      self.ready();
    } else {
      self.state.ready = false;
      setTimeout(self.checkReady.bind(self), 100);
    }
  }

  checkComplete() {
    var self = this, complete;

    if (this.props.checkComplete === false) return;

    complete = self.requireForComplete.every(key => {
      if (self.refs[key] instanceof Node) {
        return true;
      }
      if (!self.refs[key].state || (self.refs[key].state && !self.refs[key].state.complete)) {
        if (typeof self.refs[key].checkComplete === 'function') {
          self.refs[key].checkComplete();
        }
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
      return (
          <component.type
          {...component.props}
          ref={component.ref}
          key={key}
        />
      );
    });
  }

  render() {
    return (
      <div {...this.props} className={this.getClassNames()}>
        {this.renderContentList()}
      </div>
    );
  }
}

export default Component;
