/**
*  Game
*  @desc Contains...
*  @proto GlobalScope
*/

import GlobalScope from 'types/GlobalScope';

var Game = GlobalScope.extend(function () {

	this.baseType = 'TYPE_GAME';

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

export default Game;