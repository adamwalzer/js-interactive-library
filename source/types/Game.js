/**
*  Game
*  @desc Contains...
*  @proto GlobalScope
*/

import util from 'util';
import GlobalScope from 'types/GlobalScope';
import Screen from 'types/Screen';
import Collection from 'types/Collection';
import { createEntity } from 'types/Scope';

var Game = GlobalScope.extend(function () {

	var screenPrototype;

	screenPrototype = Screen;

	this.baseType = 'TYPE_GAME';
	this.screens = null;

	this.willInit = function () {
		this.addClass('pl-game');

		this.captureScreens();
		this.watchAudio();

		return this;
	};

	this.screen = function (_id, _implementation) {
		var prototype, selector, screenSelector, instance;

		if (arguments.length === 1 && typeof _id === 'function') {
			screenPrototype = Screen.extend(_id);
			return this;
		}

		if (!this.hasOwnProperty('screens')) this.screens = Collection.create();

		if (this.hasOwnProperty('$els')) {
			debugger;
			screenSelector = pl.game.config('screenSelector');
			prototype = (screenPrototype.isPrototypeOf(this)) ? this : screenPrototype;
			selector = (typeof _id === 'number') ? screenSelector+':nth-child('+(_id+1)+')' : '#'+_id;
			instance = prototype.extend(_implementation).initialize(this.find(selector));

			instance.screen = instance;
			if (!instance.game) {
				instance.game = instance.closest('.pl-game').scope();
			}
		}

		else {
			this.screens.push({
				index: (typeof _id === 'number') ? _id : null,
				name: (typeof _id === 'string') ? _id : null,
				implementation: _implementation
			});
		}

		return this;
	};

	this.captureScreens = function () {
		var screenSelector, prototype, collection;

		if (!this.hasOwnProperty('screens')) return this;

		screenSelector = pl.game.config('screenSelector');
		prototype = (screenPrototype.isPrototypeOf(this)) ? this : screenPrototype;
		collection = [];
		
		this.findOwn(screenSelector).each(this.bind(function (_index, _node) {
			var $node, screen, record, key, id, index, component;

			$node = $(_node);
			id = $node.id();
			key = (id) ? 'name' : (id = _index, 'index');
			record = this.screens.get(id, key);
			component = $node.attr('pl-component');
			screen = createEntity.call(prototype, $node, record && record.implementation);
			screen.screen = screen;
			screen.game = this;

			collection.push(screen);
			
			if (key === 'name' || component) {
				this[ util.transformId((key === 'name' && id) || component) ] = screen;
			}
		}));

		if (collection.length) this.screens = collection;

		return this;
	};

	this.watchAudio = function () {
		var playing;

		playing = Collection.create();

		this.on('audio-play', function (_event) {
			var current;

			current = playing.filter(_event.audioType, 'type');

			if (!current) {
				playing.push({
					audio: _event.target,
					type: _event.audioType
				});
				// console.log('start: playing', playing.length, current);
			}

			else {
				current.forEach(function (_record) {
					// console.log('pause', current.length, _event.audioType, [_record.audio.paused, _record.audio.currentTime]);
					_record.audio.pause();
					_record.audio.currentTime = 0;
				});
			}

			if (_event.audioType === 'voice-over') {
				if (playing.get('background', 'type')) {
					this.audio.background.music.volume = 0.2;
				}
			}
		});

		this.on('audio-ended', function (_event) {
			var index, scope;

			playing.remove(playing.get(_event.target, 'audio'));
			scope = $(_event.target).scope();

			if (util.isSet(scope, scope.screen, scope.screen.requiredQueue)) {
				if (scope.screen.requiredQueue.has(_event.target)) {
					scope.screen.requiredQueue.ready(_event.target);
				}
			}

			// console.log('stop: playing', playing);

			if (_event.audioType === 'voice-over' && !playing.get('voice-over', 'type')) {
				this.audio.background.music.volume = 1;
			}
		});
	};

});

export default Game;