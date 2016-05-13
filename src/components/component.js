import React from 'react';

class Component extends React.Component {
  constructor() {
    super();
    
    this.video = {};
    this.audio = {
      background: [],
      sfx: [],
      voiceOver: [],
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
    Object.keys(this.refs).map(key => {
      this.refs[key].start();
    });
    this.startAudio();
  }

  startAudio() {

  }

  componentDidMount() {
    this.requireForReady = Object.keys(this.refs);
    this.requireForComplete = this.requireForReady.filter(component => {
      return !component.state || !component.state.complete;
    });

    this.collectMedia();
    this.checkReady();
    this.checkComplete();
  }

  collectMedia() {
    var self = this;

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
    this.video[key] = this.refs[key];
  }

  collectAudio(key) {
    this.audio[key] = this.refs[key];
    if (this.refs[key].props.type) {
      this.audio[this.refs[key].props.type][key] = this.refs[key];
    }
  }

  checkReady() {
    var self = this;

    this.requireForReady.map((key, index) => {
      if(self.refs[key].state && self.refs[key].state.ready) {
        this.requireForReady.splice(index, 1);
      }
    });

    if (this.requireForReady.length === 0) {
      this.ready();
    } else {
      setTimeout(this.checkReady.bind(this), 100);
    }
  }

  checkComplete() {
    if (this.requireForComplete.length === 0) {
      this.complete();
    } else if (this.state.open) {
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
