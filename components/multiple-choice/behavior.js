pl.game.component('multiple-choice', function () {

	function validateAnswer () {
		var answers;

		if (this.properties.correct) {
			answers = this.properties.correct.split(/\s*,\s*/);

			if (~answers.indexOf(String(this.selected().index()))) {
				this.complete();
			}
		}

		return false;
	}

	this.init = function () {
		this.screen.require(this);
	};

	this.select = function (_data) {
		var $li;
		console.log('select');
		if (this.event) {
			$li = $(this.event.target).closest('li');

			if ($li.length && !$li.hasClass('SELECTED')) {
				$li.parent().find('.SELECTED').removeClass('SELECTED');
				$li.addClass('SELECTED');
				validateAnswer.call(this);
			}
		}

		return this;
	};

	this.selected = function () {
		return this.find('> ul > .SELECTED');
	};

});