import component from 'play.game.component';
import util from 'util';
import Events from 'types/Events';
import { default as SCOPE } from 'types/GlobalScope';
import Entity from 'types/Entity';
import Screen from 'types/Screen';
import Game from 'types/Game';

var GAMES, CONFIG, READY_QUEUE;

export default function game (_name, _implementation) {
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
			SCOPE[_name_collection] = Game
				.extend(_implementation)
				.initialize('#'+_name_collection);
			break;

		case 'object':
			GAMES.forEach(function (_item, _index) {
				SCOPE[_item.id] = Game
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

(function () {

	this.component = component;
	
	util.mixin(game, Events);

	this.run = function () {
		game.isDOMReady = true;
		game.trigger('dom-ready');

		game.component.loadAll(function () {
			console.log('** All component sources loaded.');
			initialize(GAMES);
		});
	};

	this.config = function (_key_mixin) {
		switch (typeof _key_mixin) {
			case 'string': return CONFIG[_key_mixin];
			case 'object':
				if (_key_mixin) util.mixin(CONFIG, _key_mixin);
		}

		return this;
	};

	this.provideEntityType = function () {
		return Entity;
	};

	this.provideScreenType = function () {
		return Screen;
	};

	this.scope = function (_mixin) {
		if (typeof _mixin === 'function') {
			_mixin.call(SCOPE);
		}

		else if (_mixin) {
			SCOPE.mixin(_mixin);
		}

		return this;
	};

	// TODO: Implement an actual queue
	// 
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