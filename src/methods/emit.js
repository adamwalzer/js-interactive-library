var emit = function () {
  console.log(this.game);
  this.game.trigger.apply(this.game,arguments);
}

export default emit;
