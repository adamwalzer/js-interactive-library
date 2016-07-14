var start = function (Game, id) {
  var el;

  el = document.getElementById(id);

  if (!el) {
    el = document.createElement('DIV');
    el.id = id;
    document.body.appendChild(el);
  }

  Game = typeof Game === 'object' ? Game : <Game />;

  ReactDOM.render(
    Game,
    el
  );
};

export default start;
