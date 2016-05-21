import React from 'react';
import ReactDOM from 'react-dom';

var start = function (Game, id) {
  var el;

  el = document.getElementById(id);

  if (!el) {
    el = document.createElement('DIV');
    el.id = id;
    document.body.appendChild(el);
  }

  ReactDOM.render(
    <Game />,
    el
  );
}

export default start;
