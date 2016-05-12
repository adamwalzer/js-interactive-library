import React from 'react';

class Component extends React.Component {
  constructor() {
    super();
    
  }

  complete() {
    this.setState({
      complete: true,
    })
  }

  emit(event, opts) {
    play.emit(event,opts);
  }

  render() {
    return (
      <div>woohoo!</div>
    );
  }
}

export default Component;
