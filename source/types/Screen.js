/**
*  Screen
*  @desc Contains...
*  @proto Entity
*/

import { Entity, invokeResponsibilities } from 'types/Entity';
import Queue from 'types/Queue';

var Screen = Entity.extend(function () {

	function attachBehaviorEvent () {
		this.on('behavior', function (_event) {
			console.log('SCREEN GOT', _event.targetScope.id(), _event.name);

			if (this !== _event.targetScope) {
				invokeResponsibilities(this,  _event);
			}
			
			this.propagateBehavior(_event);
		});
	}
	
	this.baseType = 'TYPE_SCREEN';
	this.game = null;
	this.screen = null;
	this.requiredQueue = null;
	this.shouldWatchBehaviors = false;

	this.__init = function () {
		this.proto();

		if (this.hasOwnProperty('shouldWatchBehaviors') && this.shouldWatchBehaviors) {
			attachBehaviorEvent.call(this);
		}
	};

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
			this.requiredQueue.on('complete', this.bind(function () {
				console.log('** screen complete');
				this.complete();
			}))
		}

		this.requiredQueue.add(_entity);
	};

	this.completed = function () {
		return this.isComplete || !this.requiredQueue || this.requiredQueue.length === 0;
	};

	this.respond('complete', function (_event) {
		if (!this.has(_event.target)) return;
		if (_event.targetScope === this) return;

		if (this.requiredQueue.length) {
			this.requiredQueue.ready(_event.behaviorTarget);
		}
	});

});

export default Screen;