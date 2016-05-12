import React from 'react';
import ReactDOM from 'react-dom';

var start = function (Game, id) {
  this.game = <Game />;
  ReactDOM.render(
    this.game,
    document.getElementById(id)
  );
}

export default start;
