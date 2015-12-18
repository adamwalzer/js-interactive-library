/**
*  Game
*  @desc Contains...
*  @proto GlobalScope
*/

import util from 'util';
import game from 'play.game';
import GlobalScope from 'types/GlobalScope';
import Screen from 'types/Screen';
import Collection from 'types/Collection';
import { createEntity } from 'types/Scope';
import { Size } from 'types/Dimensions';

var Game = GlobalScope.extend(function () {

	var Viewport, screenPrototype;

	/**
	 * Scales the game view to fill the browser window.
	 */
	function scaleGame () {
		var vpSize, gameDimensions, width, height, zoom;

		vpSize = this.viewport.size();
		gameDimensions = game.config('dimensions');
		width = gameDimensions.width || this.width();
		height = Math.round(gameDimensions.width / gameDimensions.ratio);
		zoom = this.viewport.width / width;

		if (Math.round(height * zoom) > this.viewport.height) {
			zoom = this.viewport.height / height;
		}

		this.css({
			width: width,
			zoom: zoom
		});

		this.zoom = zoom;
	}

	screenPrototype = Screen;

	this.baseType = 'TYPE_GAME';
	this.screens = null;
	this.zoom = 1;
	this.viewport = new (function () {
		
		this.size = function () {
			return Size.create().set(window.innerWidth, window.innerHeight);
		};

		Object.defineProperties(this, {
			width: {
				get: function () {
					return window.innerWidth;
				},

				configurable: false
			},

			height: {
				get: function () {
					return window.innerHeight;
				},

				configurable: false
			},

			orientation: {
				get: function () {
					var ratio = this.size().ratio();

					switch (true) {
						case ratio > 0.9 && ratio < 1.1: return 'squareish';
						case ratio > 1.1: return 'landscape';
						case ratio < 0.9: return 'protrait';
					}
				}
			}
		});

	});;

	this.willInit = function () {
		var $html;

		$html = $('html');

		$html.addClass(this.viewport.orientation);
		this.addClass('pl-game');

		$(window).on('resize', this.bind(function () {
			if (!$html.hasClass(this.viewport.orientation)) {
				$html
					.removeClass('squareish landscape protrait')
					.addClass(this.viewport.orientation);
				}
		}));

		scaleGame.call(this);
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
				util.assignRef(this, util.transformId((key === 'name' && id) || component, true), screen);
			}
		}));

		if (collection.length) this.screens = collection;

		return this;
	};

	this.watchAudio = function () {
		var playing;

		function deQueue (_scope, _item) {
			[_scope, _scope.screen].forEach(function (_scope) {
				if (_scope.requiredQueue && _scope.isMemberSafe('requiredQueue')) {
					if (_scope.requiredQueue.has(_item)) {
						_scope.requiredQueue.ready(_item);
					}					
				}				
			});
		}

		playing = Collection.create();

		this.on('audio-play', function (_event) {
			var current, bgMusic;

			if (_event.audioType !== 'sfx') {
				current = playing.filter(_event.audioType, 'type');
				bgMusic = playing.filter('background', 'type');

				if (current) {
					current.forEach(function (_record) {
						_record.audio.pause();
						_record.audio.currentTime = 0;
					});
				}

				if (_event.audioType === 'voice-over') {
					if (bgMusic) bgMusic.forEach(function (_record) {
						_record.audio.volume = 0.2;
					});
				}
			}

			playing.push({
				audio: _event.target,
				type: _event.audioType
			});
		});

		this.on('audio-ended audio-pause', function (_event) {
			var current, scope, bgMusic;

			current = playing.get(_event.target, 'audio')
			scope = $(_event.target).scope();
			bgMusic = playing.filter('background', 'type');

			playing.remove(current);
			deQueue(scope, _event.target);

			if (_event.audioType === 'voice-over' && !playing.get('voice-over', 'type')) {
				if (bgMusic) bgMusic.forEach(function (_record) {
					_record.audio.volume = 1;
				});
			}
		});
	};

	this.flip = function () {
		console.log('THATS A FLIP!');
	};

	this.exit = function () {
		console.log('exit game!');
		window.close();
	};

});

export default Game;
