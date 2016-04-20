pl.game.component('selectable', function () {

  this.behavior('select', function (_target) {
    var $target;

    if (this.event) {
      $target = $(this.event.target).closest('li');

      if (this.shouldSelect($target) !== false) {
        return {
          message: $target.index(),
          behaviorTarget: $target
        };
      } 
    }

    else {
      this.proto(_target);
    }

    return false;
  });

  this.shouldSelect = function (_target) {
    return true;
  };

});