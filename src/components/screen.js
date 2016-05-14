import React from 'react';

import Component from 'components/component';

class Screen extends Component {
  constructor() {
    super();

    this.state = {
      started: false,
      ready: false,
      open: false,
      leave: false,
      close: true,
      complete: false,
      load: false,
    };
  }

  goto(index) {
    this.props.trigger('goto',{index});
  }

  load() {
    if (!this.state.load) {
      this.setState({
        load: true,
        ready: false,
      });
    }

    this.componentDidMount();
  }

  start() {
    this.setState({
      started: true
    }, this.checkComplete.bind(this));

    Object.keys(this.refs).map(key => {
      this.refs[key].start();
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
    this.start();
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

    if(this.state.ready) classNames += ' READY';
    if(this.state.open) classNames += ' OPEN';
    if(this.state.leave) classNames += ' LEAVE';
    if(this.state.close) classNames += ' CLOSE';
    if(this.state.complete) classNames += ' COMPLETE';

    return classNames;
  }

  renderContent() {
    if (!this.state.load) {
      return null;
    }

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
      <div className={'screen'+this.getClassNames()}>
        {this.renderContent()}
        {this.renderPrevButton()}
        {this.renderNextButton()}
      </div>
    );
  }
}

export default Screen;
