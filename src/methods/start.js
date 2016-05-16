import React from 'react';
import ReactDOM from 'react-dom';

var start = function (Game, id) {
  ReactDOM.render(
    <Game />,
    document.getElementById(id)
  );
}

export default start;
