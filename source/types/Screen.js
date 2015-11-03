/**
*  Screen
*  @desc Contains...
*  @proto Entity
*/

import Entity from 'types/Entity';

export default Entity.extend(function () {

	// this.handleProperty(function () {
		
	// 	this.component = function (_node, _name, _value, _property) {
	// 		var record, scope, id;

	// 		if ($(_node).data('pl-component')) return;

	// 		record = pl.game.component.get(_value);
	// 		scope = this.extend(record.implementation).initialize(_node, true);
	// 		id = scope.attr('id') || _value;

	// 		this.entities.push(scope);
	// 		this[id] = scope;

	// 	};

	// });
	
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