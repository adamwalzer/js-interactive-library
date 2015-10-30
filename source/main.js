import evalAction from 'evalAction';
import util from 'util';
import type from 'types/Basic';
import Events from 'types/Events';
import Scope from 'types/Scope';
import Game from 'types/Game';

var Play = new (function () {
	
	var SCOPE;

	SCOPE = type.GlobalScope;

	this.EVENT = {
		// gotta find a better way to test for touch enabled devices
		CLICK: (/ipad|iphone|android/i).test(navigator.userAgent) ? 'touchend' : 'click'
	};
	
	this.game = (function () {
		var GAMES, CONFIG, READY_QUEUE;

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

		ready.dom = function (_event) {
			game.isDOMReady = true;
			game.trigger('dom-ready');

			initialize(GAMES);
		};

		function register (_name, _implementation) {
			if (!~GAMES.indexOf(_name)) {
				GAMES.push({
					id: _name,
					implementation: _implementation
				});
			}
		}

		function initialize (_name_collection, _implementation) {
			switch (typeof _name_collection) {
				case 'string':
					SCOPE[_name_collection] = type.Game
						.extend(_implementation)
						.initialize('#'+_name_collection);
					break;

				case 'object':
					GAMES.forEach(function (_item, _index) {
						SCOPE[_item.id] = type.Game
							.extend(_item.implementation)
							.initialize('#'+_item.id);
					});

					GAMES = null;
					break;
			}
		}

		GAMES = [];
		CONFIG = {};
		READY_QUEUE = [];

		util.mixin(game, type.Events);

		game.config = function (_key_mixin) {
			switch (typeof _key_mixin) {
				case 'string': return CONFIG[_key_mixin];
				case 'object':
					if (_key_mixin) util.mixin(CONFIG, _key_mixin);
			}

			return this;
		};

		// TODO: Implement an actual queue
		// 
		game.queue = function (_item) {
			if (!~READY_QUEUE.indexOf(_item)) READY_QUEUE.push(_item);

			return this;
		};

		game.queue.complete = function (_item, _eventName) {
			var index;

			index = READY_QUEUE.indexOf(_item);
			READY_QUEUE.splice(index, 1);

			ready(_eventName);

			return this;
		};

		document.addEventListener('DOMContentLoaded', ready.dom, false);
		
		return game;

	}());

	this.game.component = (function () {
		var COMPONENTS;

		function component (_name, _implementation) {
			if (!component.get(_name)) {
				COMPONENTS.push({
					name: _name,
					implementation: _implementation
				});
			}

			return this;
		}

		COMPONENTS = [];

		component.get = function (_name) {
			var i, record;

			for (i=0; record = COMPONENTS[i]; i+=1) {
				if (record.name === _name) return record;
			}

			return null;
		};

		component.load = function (_path, _callback) {
			$.loadScript
			return this;
		};
		component.config = function () {};

		return component;
	}());

	this.type = type;
	this.util = util;
});

/**
*  @desc Resolves the scope for each of the set of matched elements.
*  @return (Scope|Array) Returns the scope for 1 result and an array of scopes for multiple elements.
*/
$.fn.scope = function () {
	var result;

	result = [];

	this.each(function () {
		var $node, scope;

		$node = $(this)
		scope = $node.data('pl-scope');
		
		if (!scope) {
			scope = $node.closest('.pl-scope').data('pl-scope');
		}

		if (scope) result.push(scope);
	});

	return (result.length > 1) ? result : result[0];
};
window.Play = window.pl = Play;