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

	this.baseType = 'TYPE_GAME';
	this.screens = null;

	this.willInit = function () {
		this.addClass('pl-game');

		this.captureScreens();
		// this.captureAudioAssets();
		this.watchAudio();

		return this;
	};

	this.screen = function (_id, _implementation) {
		var prototype, selector, screenSelector, instance;

		if (!this.hasOwnProperty('screens')) this.screens = Collection.create();

		if (this.hasOwnProperty('$els')) {
			debugger;
			screenSelector = pl.game.config('screenSelector');
			prototype = (Screen.isPrototypeOf(this)) ? this : Screen;
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
		var scope, screenSelector, prototype, collection;

		if (!this.hasOwnProperty('screens')) return this;

		scope = this;
		// Screen = game.provideScreenType();
		screenSelector = pl.game.config('screenSelector');
		prototype = (Screen.isPrototypeOf(this)) ? this : Screen;
		collection = [];
		
		this.find(screenSelector).each(function (_index) {
			var $node, screen, record, key, id, index, component;

			// Skip screens that are nested. They will be initialized by their parent scope.
			if (!scope === $(this).scope()) return;

			$node = $(this);
			id = $node.id();
			key = (id) ? 'name' : (id = _index, 'index');
			record = scope.screens.get(id, key);
			screen = createEntity.call(prototype, $node, record && record.implementation);
			screen.screen = screen;
			screen.game = scope;

			collection.push(screen);
			
			if (id||component) scope[util.transformId(id||component)] = screen;
		});

		if (collection.length) this.screens = collection;

		scope = null;

		return this;
	};

	this.watchAudio = function () {
		var playing;

		playing = [];

		this.on('audio-play', function (_event) {
			if (!~playing.indexOf(_event.audioType)) {
				playing.push(_event.audioType);
			}

			if (_event.audioType === 'voice-over') {
				if (~playing.indexOf('background')) {
					this.audio.background.music.volume = 0.2;
				}
			}
		});

		this.on('audio-ended', function (_event) {
			var index;

			index = playing.indexOf(_event.audioType);
			if (~index) playing.splice(index, 1);

			if (_event.audioType === 'voice-over') {
				this.audio.background.music.volume = 1;
			}
		});
	};

});

export default Game;