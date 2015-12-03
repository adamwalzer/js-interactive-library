/**
 * Defines the 'game' method for registering and initi game scopes. This method also acts as a namespace for game level functions (See: [pl.game]{@link module:play~pl.game}).
 *
 * @module game
 * @author Micah Rolon <micah@ginasink.com>
 *
 * @requires play.game.component
 * @requires play.game.manager
 * @requires util
 * @requires types/Events
 * @requires types/GlobalScope
 * @requires types/Entity
 * @requires types/Screen
 * @requires types/Game
 */
import component from 'play.game.component';
import manager from 'play.game.manager';
import util from 'util';
import Events from 'types/Events';
import { default as SCOPE } from 'types/GlobalScope';
import Entity from 'types/Entity';
import Screen from 'types/Screen';
import Game from 'types/Game';

var GAMES, CONFIG, READY_QUEUE;

/**
 * Define a game scope for registration and/or initialization.
 * This method also acts as a namespace for game level functions (See: [pl.game]{@link module:play~pl.game}).
 *
 * @arg {string} _name - The name of the game matched with a DOM nodes 'id' attribute.
 * @arg {function|object} _implementation - The constructor or object which implements the scope behavior.
 */
function game (_name, _implementation) {
	if (game.isDOMReady) {
		initialize(_name, _implementation);
	}

	else {
		register(_name, _implementation);
	}
}

function ready (_eventName) {
	if (READY_QUEUE.length) return false;
	game.trigger(_eventName || 'ready');
}

/**
 * Registers an implementation of a game scope for initialization.
 * @protected
 * @arg {string} _name - The name of the game matched with a DOM nodes 'id' attribute.
 * @arg {function|object} _implementation - The constructor or object which implements the scope behavior.
 */
function register (_name, _implementation) {
	if (!~GAMES.indexOf(_name)) {
		GAMES.push({
			id: _name,
			implementation: _implementation
		});
	}
}

/**
 * Initializes an implementation of a game scope. (overloaded)
 * @function initialize
 * @protected
 * @arg {string} _name - The name of the game matched with a DOM nodes 'id' attribute.
 * @arg {function|object} _implementation - The constructor or object which implements the scope behavior.
 */

/**
 * Initializes an implementation of a game scope.
 * @protected
 * @arg {array} _collection - The collection of game scope records for initialization.
 * @arg {function|object} _implementation - The constructor or object which implements the scope behavior.
 */
function initialize (_name_collection, _implementation) {
	switch (typeof _name_collection) {
		case 'string':
			SCOPE[_name_collection] = Game
				.extend(_implementation)
				.initialize('#'+_name_collection);
			break;

		case 'object':
			_name_collection.forEach(function (_item, _index) {
				initialize(_item.id, _item.implementation);
			});
			break;
	}
}


/** @protected */
GAMES = [];
/** @protected */
CONFIG = {};
/** @protected */
READY_QUEUE = [];

/**
 * Interface for game level configuration.
 * @namespace game
 * @memberof module:play~pl
 * @mixes Events
 */
(function () {

	this.component = component;
	this.manager = manager;
	
	util.mixin(game, Events);

	/**
	 * Starts the dominos falling
	 * @memberof module:play~pl.game
	 */
	this.run = function () {
		game.isDOMReady = true;
		game.trigger('dom-ready');

		game.component.loadAll(function () {
			// console.log('** All component sources loaded.');
			initialize(GAMES);

			GAMES = null;
		});
	};

	/**
	 * Getter/Setter for game level configuration.
	 * @arg {string|object} _key_mixin - _key: The key to retrieve. _mixin: Object to set properties on configuration.
	 * @returns {this}
	 *
	 * @memberof module:play~pl.game
	 */
	this.config = function (_key_mixin) {
		switch (typeof _key_mixin) {
			case 'string': return CONFIG[_key_mixin];
			case 'object':
				if (_key_mixin) util.mixin(CONFIG, _key_mixin);
		}

		return this;
	};

	/**
	 * @deprecated
	 * @memberof module:play~pl.game
	 */
	this.provideEntityType = function () {
		return Entity;
	};

	/**
	 * @deprecated
	 * @memberof module:play~pl.game
	 */
	this.provideScreenType = function () {
		return Screen;
	};

	/**
	 * Augments the global scope.
	 * @arg {function|object} _mixin - Object or constructor to define members.
	 * @returns {this}
	 *
	 * @memberof module:play~pl.game
	 */
	this.scope = function (_mixin) {
		if (typeof _mixin === 'function') {
			_mixin.call(SCOPE);
		}

		else if (_mixin) {
			SCOPE.mixin(_mixin);
		}

		return this;
	};

	/**
	 * @deprecated
	 * @memberof module:play~pl.game
	 */
	this.queue = function (_item) {
		if (!~READY_QUEUE.indexOf(_item)) READY_QUEUE.push(_item);

		return this;
	};

	this.queue.complete = function (_item, _eventName) {
		var index;

		index = READY_QUEUE.indexOf(_item);
		READY_QUEUE.splice(index, 1);

		ready(_eventName);

		return this;
	};

}).call(game);

export default game;