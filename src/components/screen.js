import React from 'react';

import Component from 'components/component';

class Screen extends Component {
  constructor() {
    super();

    this.state = {
      ready: true,
      open: false,
      leave: false,
      close: true,
    };
  }

  goto(index) {
    this.props.emit('goto',{index});
  }

  open() {
    this.setState({
      open: true,
      leave: false,
      close: false,
    });
    setTimeout(this.complete.bind(this), 500);
  }

  leave() {
    this.setState({
      open: false,
      leave: true,
      close: false,
    });
  }

  close() {
    this.setState({
      open: false,
      leave: false,
      close: true,
    });
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
