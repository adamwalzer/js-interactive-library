pl.game.component('multiple-choice', function () {

	function validateAnswer (_scope) {
		var answers;

		if (_scope.properties.correct) {
			answers = _scope.properties.correct.split(/\s*,\s*/);
			console.log('selected', _scope.getSelected());
			if (~answers.indexOf(String(_scope.getSelected().index()))) {
				_scope.complete();
			}
		}

		return false;
	}

	this.init = function () {
		this.screen.require(this);
	};

	this.answer = function () {
		if (this.event) {
			$li = $(this.event.target).closest('li');

			if (this.select($li)) {
				validateAnswer(this);
			}
		}
	}

	// this.selected = function () {
	// 	return this.find('> ul > .SELECTED');
	// };

});