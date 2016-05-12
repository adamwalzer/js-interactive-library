import React from 'react';

class Component extends React.Component {
  constructor() {
    super();
    
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
    if (typeof this.props.emit === 'function') this.props.emit('ready', {component:this});
  }

  componentDidMount() {
    this.requireForReady = Object.keys(this.refs);

    this.checkReady();
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
      setTimeout(this.checkReady.bind(this), 125);
    }
  }

  render() {
    return (
      <div>woohoo!</div>
    );
  }
}

export default Component;
