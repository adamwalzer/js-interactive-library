/**
*  Screen
*  @desc Contains...
*  @proto Entity
*/

import Entity from 'types/Entity';

var Screen = Entity.extend(function () {
	
	this.baseType = 'TYPE_SCREEN';
	this.game = null;
	this.screen = null;

	this.next = function () {
		console.log('Screen next()');
		return this.game.screens[this.index()+1];
	};

	this.prev = function () {
		console.log('Screen prev()');
		return this.game.screens[this.index()-1];
	};

});

export default Screen;