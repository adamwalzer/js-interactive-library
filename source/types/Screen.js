/**
*  Screen
*  @desc Contains...
*  @proto Entity
*/

import Entity from 'types/Entity';
import Queue from 'types/Queue';

var Screen = Entity.extend(function () {
	
	this.baseType = 'TYPE_SCREEN';
	this.game = null;
	this.screen = null;
	this.requiredQueue = null;
	this.isComplete = undefined;

	this.start = function () {
		return this;
	};

	this.stop = function () {
		return this;
	};

	this.next = function () {
		console.log('Screen next()');
		if (!this.completed()) return false;
		return this.game.screens[this.index()+1];
	};

	this.prev = function () {
		console.log('Screen prev()');
		return this.game.screens[this.index()-1];
	};

	this.nextSib = function () {
		return $.fn.next.apply(this.$els, arguments);
	};

	this.prevSib = function () {
		return $.fn.prev.apply(this.$els, arguments);
	};

	this.require = function (_entity) {
		if (!this.hasOwnProperty('requiredQueue')) {
			this.requiredQueue = Queue.create();
		}

		this.requiredQueue.add(_entity);
	};

	this.completed = function () {
		return !this.requiredQueue || this.requiredQueue.length === 0;
	};

	this.respond('complete', function (_event) {
		this.requiredQueue.remove(_event.behaviorTarget);

		if (!this.requiredQueue.length) this.complete();
	});

});

export default Screen;