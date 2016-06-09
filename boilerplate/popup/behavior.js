pj.game.component('popup', function () {
  
  // Forces component to use base type method
  // instead of scope prototype.
  this.open = function (_target) {
    this.sup();
  };

});