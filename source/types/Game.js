/**
*  Game
*  @desc Contains...
*  @proto GlobalScope
*/

import GlobalScope from 'types/GlobalScope';

export default GlobalScope.extend(function () {

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