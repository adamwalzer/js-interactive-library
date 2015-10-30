import type from 'types/Basic';
import Scope from 'types/Scope';
/**
*  @desc Contains...
*  @proto GlobalScope
*/
export default type('Game : GlobalScope', function () {

	this.setup = function () {
		var game;

		game = this;

		this.screens.forEach(function (_screen) {
			_screen.game = game;
		});

		this.addClass('pl-game');

		return this;
	};

});