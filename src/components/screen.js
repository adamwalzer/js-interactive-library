import React from 'react';

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
    play.trigger('goto',{index});
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

  start() {
    this.bootstrap();

    Object.keys(this.refs).map(key => {
      if (typeof this.refs[key].start === 'function') {
        this.refs[key].start();
      }
    });

    this.startMedia();
  }

  startMedia() {
    if (this.video[0]) {
      this.video[0].play();
    } else if (this.audio.voiceOver[0]) {
      this.audio.voiceOver[0].play();
    }
  }

  open() {
    this.setState({
      open: true,
      leave: false,
      close: false,
    });
    setTimeout(
      this.start.bind(this),
      250
    );
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
    var classNames = '';

    if (!(this.state.open || this.state.leave)) {
      this.state.close = true;
    }

    if (this.state.ready) classNames += ' READY';
    if (this.state.load) classNames += ' LOAD';
    if (this.state.open) classNames += ' OPEN';
    if (this.state.leaving) classNames += ' LEAVING';
    if (this.state.leave) classNames += ' LEAVE';
    if (this.state.close || !(this.state.open || this.state.leave)) classNames += ' CLOSE';
    if (this.state.complete) classNames += ' COMPLETE';

    return classNames;
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
      <button className='prev-screen' onClick={this.goto.bind(this,this.props.index-1)}></button>
    );
  }

  renderNextButton() {
    return (
      <button className='next-screen' onClick={this.goto.bind(this,this.props.index+1)}></button>
    );
  }

  render() {
    return (
      <div id={this.state.id} className={'screen'+this.getClassNames()}>
        {this.renderScreen()}
        {this.renderPrevButton()}
        {this.renderNextButton()}
      </div>
    );
  }
}

export default Screen;
