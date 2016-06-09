pl.game.component('multiple-choice', function () {

  function validateAnswer (_scope) {
    var answers;

    if (_scope.properties.correct) {
      answers = _scope.properties.correct.split(/\s*,\s*/);

      if (~answers.indexOf(String(_scope.getSelected().index()))) {
        _scope.complete();
      }
    }

    return false;
  }

  this.answer = function () {
    if (this.event) {
      $li = $(this.event.target).closest('li');

      if (!this.isComplete && this.select($li)) {
        validateAnswer(this);
      }
    }
  };

});