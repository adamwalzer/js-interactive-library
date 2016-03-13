/**
 * Node scope for the top level game node.
 */
import util from 'util';
import game from 'play.game';
import GlobalScope from 'types/GlobalScope';
import Screen from 'types/Screen';
import Collection from 'types/Collection';
import { createEntity } from 'types/Scope';
import { Size } from 'types/Dimensions';
import { MediaManager } from 'types/AudioManager';

var Game = GlobalScope.extend(function () {

	var Viewport, screenPrototype, platformEventHandler;

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
			zoom = (this.viewport.height / height).toPrecision(4);
		}

		util.mixin(this.node().style, {
			width: width+'px',
			zoom: zoom
		});

		if (!this.css('zoom')) {
			this.css({
				transform: 'scale('+zoom+')',
				transformOrigin: (zoom < 1 ? '0px' : '50%')+' 0px 0px',
				height: this.viewport.height / zoom
			});
		}

		this.zoom = zoom;
	}

	function demoMode (_set) {
		this.demoMode = _set != null ? _set : !this.demoMode;
		this[this.demoMode ? 'addClass' : 'removeClass']('DEMO');

		console.info(this.id(), 'is now '+(this.demoMode ? 'in' : 'out of')+' Demo Mode.');
	}

	function collectVideos () {
		this.find('video').each(function (_index, _node) {
			this.media.video.add(_node);
			
			_node.onplay = function () {
				var playing = this.media.playing('.background, .voiceOver');
				if (playing) playing.stop('@ALL');
				this.log('video play', playing);
			}.bind(this);
		}.bind(this));
	}

	screenPrototype = Screen;
	platformEventHandler = new (function () {
		
		this.invoke = function (_event, _ctx) {
			if (typeof this[_event.name] === 'function') {
				this[_event.name].call(_ctx, _event);
			}
		};

		this['toggle-demo-mode'] = function (_set) {
			demoMode.call(this);
		};
	});

	this.baseType = 'TYPE_GAME';
	this.screens = null;
	this.zoom = 1;
	this.keyCommands = null;
	this.demoMode = false;
	this.media = null;
	this.viewport = new (function () {
		var vp, $html, RESIZE_HANDLERS;

		vp = this;
		$html = $('html');
		RESIZE_HANDLERS = [];

		$(window).on('resize', function (_event) {
			if (!$html.hasClass(vp.orientation)) {
				$html
					.removeClass('squareish landscape protrait')
					.addClass(vp.orientation);
			}

			RESIZE_HANDLERS.forEach(function (_handler) {
				_handler(_event);
			});
		});

		this.LANDSCAPE = 'landscape';
		this.PROTRAIT = 'protrait';
		this.SQUAREISH = 'squareish';
		
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

		this.onResize = function (_handler) {
			RESIZE_HANDLERS.push(_handler);
		};

		this.offResize = function (_handler) {
			var index = RESIZE_HANDLERS.indexOf(_handler);

			if (~index) RESIZE_HANDLERS.splice(index, 1);
		};

		$html.addClass(this.orientation);

	});;

	this.willInit = function () {
		this.addClass('pl-game');

		scaleGame.call(this);
		this.watchAudio();
		this.captureScreens();

		this.viewport.onResize(this.bind(scaleGame));

		pl.game.on('platform-event', this.bind(function (_event) {
			platformEventHandler.invoke(_event, this);
		}));

		return this;
	};

	/**
	 * Watch for specific keys or combination of keys. NOTE: meta key commands DO NOT support chords (i.e. meta+K,B).
	 * ### Key Names
	 * - *meta*: Command (aka Apple ⌘ or win)
	 * - *alt*: Alt (aka Option ⌥)
	 * - *shift*: Shift ⇪
	 * - *ctrl*: Control ^
	 * - *enter*: Enter or Return
	 * - *esc*: Escape
	 * - *left*: Left arrow
	 * - *up*: Up arrow
	 * - *right*: Right arrow
	 * - *down*: Down arrow
	 *
	 * ### Example
	 * ```javascript
	 * // Overriding print.
	 * this.game.onKeys('cmd+P', printHandler);
	 *
	 * // Holding Control and pressing "K" then "B"
	 * this.game.onKeys('ctrl+K,B', handler);
	 * ```
	 * @arg {string} _commands - The key or sequence of keys.
	 * @arg {function} _handler - Your event handler for when you key pattern is matched.
	 * @returns `this`
	 */
	this.onKeys = function (_commands, _handler) {
		var sequence, chords, modifiers, map;

		if (!this.keyCommands) {
			this.keyCommands = {};

			map = {
				13: 'enter',
				16: 'shift',
				17: 'ctrl',
				18: 'alt',
				27: 'esc',
				37: 'left',
				38: 'up',
				39: 'right',
				40: 'down',
				91: 'meta',
				enter: 13,
				shift: 16,
				ctrl : 17,
				alt  : 18,
				esc  : 27,
				left : 37,
				up   : 38,
				right: 39,
				down : 40,
				meta : 91
			};

			modifiers = [16, 17, 18, 91];
			sequence = [];
			chords = [];

			this.on('keydown', function (_event) {
				var modifier, key, eventMods, currentMods, command, handler;

				modifier = (!!~modifiers.indexOf(_event.keyCode)) && map[_event.keyCode];
				key = (modifier) ? modifier : map[_event.keyCode] || String.fromCharCode(_event.keyCode);
				eventMods = [_event.shiftKey, _event.ctrlKey, _event.altKey, _event.metaKey];
				currentMods = [];

				// Collect the modifiers the event says are still down.
				eventMods.forEach(function (_modifierDown, _index) {
					// use the modifier name
					if (_modifierDown) currentMods.push(map[modifiers[_index]]);
				});

				// Don't add keys we already have during rapid-fire events
				if (~chords.indexOf(key) || ~sequence.indexOf(key)) return;

				// Construct the command
				command = chords.length ?
					(chords.push(key), chords.join(',')) :
					(sequence.push(key), sequence.join('+'));

				handler = this.keyCommands[command];

				if (handler) {
					handler.call(this, _event, command);
					// Keep current modifiers.
					sequence = currentMods.map(function (_key, _index) {
						var key = sequence[_index];
						return currentMods[currentMods.indexOf(key)];
					});
					chords = [];

					// Override original key command (i.e. meta+Q).
					_event.preventDefault();
				}
			});

			this.on('keyup', function (_event) {
				var key, index, modifier, eventMods, currentMods;

				key = (modifier) ? modifier : map[_event.keyCode] || String.fromCharCode(_event.keyCode);
				index = sequence.indexOf(key);
				modifier = (!!~modifiers.indexOf(_event.keyCode)) && map[_event.keyCode];
				// Follows the same index order as "modifiers" [16, 17, 18, 91]
				eventMods = [_event.shiftKey, _event.ctrlKey, _event.altKey, _event.metaKey];
				currentMods = [];

				// Collect the modifiers the event says are still down.
				eventMods.forEach(function (_modifierDown, _index) {
					// use the modifier name
					if (_modifierDown) currentMods.push(map[modifiers[_index]]);
				});

				// If the key released is a modifier...
				if (key === modifier) {
					// ...keep current modifiers...
					sequence = currentMods.map(function (_key, _index) {
						var key = sequence[_index];
						return currentMods[currentMods.indexOf(key)];
					});
					// ...clear registered chords.
					chords = [];
				}

				else {
					// If we had pressed more than one key...
					if (sequence.length > 1) {
						// Check if the first is a modifier then switch to chord capturing
						if (~modifiers.indexOf(map[sequence[0]])) {
							chords.push(sequence.join('+'));
						}
					}
					
					if (~index) sequence.splice(index, 1);
					if (!sequence.length) chords = [];
				}
			});
		}

		this.keyCommands[_commands] = _handler;

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

		screenSelector = pl.game.config('screenSelector');
		prototype = (screenPrototype.isPrototypeOf(this)) ? this : screenPrototype;
		collection = [];
		
		this.findOwn(screenSelector).each(this.bind(function (_index, _node) {
			var $node, screen, record, key, id, index, component;

			$node = $(_node);
			id = $node.id();
			key = (id) ? 'name' : (id = _index, 'index');
			record = this.screens && this.screens.get(id, key);
			component = $node.attr('pl-component');
			screen = createEntity.call(prototype, $node, record && record.implementation);
			screen.screen = screen;
			screen.game = this;

			if ($node.attr('pl-skip') == null) collection.push(screen);
			
			if (key === 'name' || component) {
				util.assignRef(this, util.transformId((key === 'name' && id) || component, true), screen);
			}
		}));

		if (collection.length) this.screens = collection;

		return this;
	};

	this.watchAudio = function () {
		this.media = MediaManager.create(this.id());

		/**
		 * Prevent duplicate playback of voiceOvers and backgrounds.
		 */
		this.media.rule('.background, .voiceOver', 'shouldPlay', function (_event) {
			var playing = this.playing() || [];
			// shouldPlay = false if _event.target is already playing.
			_event.response(!~playing.indexOf(_event.target));
		});

		/**
		 * 
		 */
		this.media.rule('.voiceOver', function (_event) {
			var audio, playing;

			audio = _event.target;
			playing = audio && this.playing('.audio:not(#'+audio.id()+')');

			switch (_event.type) {
				case 'play':
					if (playing) {
						playing.filter('.voiceOver').stop('@ALL');
						playing.filter('.background').volume(game.config('bgVolume.drop') || 0.2);
					}
					break;

				case 'pause':
				case 'stopped':
				case 'ended':
					if (playing) playing.filter('.background').volume(game.config('bgVolume.max') || 1);
					break;
			}
		});

		this.media.rule('.background', 'play', function (_event) {
			var playing = this.playing('.background:not(#'+_event.target.id()+')');
			if (playing) playing.stop('@ALL');
		});

		if (~pl.EVENT.ACTION.indexOf('touch')) {
			this.on(pl.EVENT.ACTION, function beginAudio (_event) {
				var ctx, screen;

				ctx = game.getAudioContext();
				screen = this.currentScreen();

				if (screen && ctx && ctx.state === 'suspended') {
					game.enableAudioContext();
					this.log('awesome!');
					screen.startAudio();
					this.off(pl.EVENT.ACTION, beginAudio);
				}
			});
		}

		collectVideos.call(this);
	};

	this.progress = function () {
		return {
			currentScreen: this.currentScreen().index()
		};
	};

	this.currentScreen = function () {
		return this.findOwn(pl.game.config('screenSelector')+'.OPEN').not('#quit').scope();
	};

	this.flip = function () {
		console.log('THATS A FLIP!');
		game.report.flip(this);
	};

	this.exit = function () {
		console.log('GOODBYE!');
		game.report.exit(this);
	};

	/**
	 * Demo mode key command
	 */
	this.onKeys('ctrl+D,M', function () {
		demoMode.call(this);
	});

	/**
	 * Keyboard screen navigation
	 */
	this.onKeys('left', function () {
		var current;

		current = this.currentScreen();

		if (current) current.prev();
	});

	this.onKeys('right', function () {
		var current;

		current = this.currentScreen();
		
		if (current) current.next();
	});

});

export default Game;
