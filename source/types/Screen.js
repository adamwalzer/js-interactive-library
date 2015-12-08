/**
*  Screen
*  @desc Contains...
*  @proto Entity
*/

import { Entity, invokeResponsibilities } from 'types/Entity';

var Screen = Entity.extend(function () {

	function attachBehaviorEvent () {
		this.on('behavior', function (_event) {
			// console.log('SCREEN GOT', _event.targetScope.id(), _event.name);

			if (this !== _event.targetScope) {
				invokeResponsibilities(this,  _event);
			}
			
			this.propagateBehavior(_event);
		});
	}
	
	this.baseType = 'TYPE_SCREEN';
	this.game = null;
	this.screen = null;

	this.__init = function () {
		this.proto();

		if (this.hasClass('screen')) {
			attachBehaviorEvent.call(this);
		}
	};

	this.start = function () {
		return this;
	};

	this.stop = function () {
		return this;
	};

	this.index = function () {
		if (this === this.screen) return this.game.screens.indexOf(this);
		return this.$els.index();
	};

	this.next = function () {
		if (!this.completed()) return false;
		return this.game.screens[this.screen.index()+1];
	};

	this.prev = function () {
		return this.game.screens[this.screen.index()-1];
	};

	this.quit = function () {
		this.game.quit.open();
	};

	this.nextSib = function () {
		return $.fn.next.apply(this.$els, arguments);
	};

	this.prevSib = function () {
		return $.fn.prev.apply(this.$els, arguments);
	};

	this.completed = function () {
		return this.isComplete || !this.requiredQueue || this.requiredQueue.length === 0;
	};

	this.respond('complete', function (_event) {
		if (!this.has(_event.target)) return;
		if (_event.targetScope === this) return;

		if (this.hasOwnProperty('requiredQueue') && this.requiredQueue.length) {
			this.requiredQueue.ready(_event.behaviorTarget);
		}
	});

});

export default Screen;