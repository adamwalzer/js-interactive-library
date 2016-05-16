import React from 'react';

class Component extends React.Component {
  constructor() {
    super();

    this.state = {
      started: false
    };
  }

  complete() {
    this.setState({
      complete: true,
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
    });

    Object.keys(this.refs).map(key => {
      if (typeof this.refs[key].start === 'function') this.refs[key].start();
    });

    this.checkComplete();
  }

  stop() {
    var self = this;

    this.setState({
      started: false
    });

    Object.keys(this.refs).map(key => {
      if (self.refs[key] && typeof self.refs[key].stop === 'function') {
        self.refs[key].stop();
      }
    });
  }

  componentWillMount() {
    this.setState({
      ready: false,
    });
  }

  componentDidMount() {
    this.bootstrap();
  }

  bootstrap() {
    var self = this;
    this.requireForReady = Object.keys(this.refs);
    this.requireForComplete = this.requireForReady.filter(key => {
      return !self.refs[key].state || !self.refs[key].state.complete;
    });

    this.collectMedia();
    this.checkReady();
  }

  collectMedia() {
    var self = this;

    this.video = [];
    this.audio = {
      background: [],
      sfx: [],
      voiceOver: [],
    };

    Object.keys(this.refs).map(key => {
      if (play.Video && self.refs[key] instanceof play.Video) {
        self.collectVideo(key);
      }

      if (play.Audio && self.refs[key] instanceof play.Audio) {
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

    this.requireForReady = this.requireForReady.filter((key) => {
      if (self.refs[key].state && !self.refs[key].state.ready) {
        self.refs[key].bootstrap();
        return true;
      }
      return false;
    });

    if (this.requireForReady.length === 0) {
      this.ready();
    } else {
      this.state.ready = false;
      setTimeout(this.checkReady.bind(this), 100);
    }
  }

  checkComplete() {
    var self = this;

    this.requireForComplete = this.requireForComplete.filter((key) => {
      if (!self.refs[key].state || (self.refs[key].state && !self.refs[key].state.complete)) {
        if (typeof self.refs[key].checkComplete === 'function') {
          self.refs[key].checkComplete();
        }
        return true;
      }
      return false;
    });

    if (this.requireForComplete.length === 0) {
      this.complete();
    } else if (this.state.started) {
      this.state.complete = false;
      setTimeout(this.checkComplete.bind(this), 100);
    }
  }

  render() {
    return (
      <div>woohoo!</div>
    );
  }
}

export default Component;
