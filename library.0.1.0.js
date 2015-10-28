/**
*  PlayJS (temporary name)
*  
*  @author Micah Rolon <micah@ginasink.com>
*  @description A simple and beautiful game development library.
*/

var Play, pl;

Play = pl = new (function () {

	var util, Basic, SCOPE;

	// TODO: Implement dot notation parsing for type namespacing.
	// 
	function type (_name, _constructor_object) {
		var tokens, name, prototype;

		tokens = _name.split(/\s*:\s*/);
		name = tokens[0];
		prototype = tokens[1] && type[tokens[1]];

		return type[name] = _constructor_object ? (prototype || Basic).extend(_constructor_object) : (prototype || Basic).create();
	}

	util = new (function () {

		this.mixin = function () {
			var member, i, target, objs;

			target = arguments[0];
			objs = [].slice.call(arguments, 1);

			for (i=0; i < objs.length; i+=1) {
				for (member in objs[i]) {
					if (!objs[i].hasOwnProperty(member)) continue;
					target[member] = objs[i][member];
				}
			}

			return target;
		};

		this.keyOf = function (_obj, _member) {
			var member;

			for (member in _obj) {
				if (!_obj.hasOwnProperty(member)) continue;
				if (_obj[member] === _member) return member;
			}

			return null;
		};

		this.getOwner = function (_obj, _method) {
			var prototype, name;

			prototype = Object.getPrototypeOf(_obj);

			while (prototype) {
				name = util.keyOf(prototype, _method);

				if (name) break;

				prototype = Object.getPrototypeOf(prototype);
			}

			return {
				name: name,
				object: prototype
			};
		};

	});

	Basic = new (function () {
		
		this.create = function () {
			return Object.create(this);
		};

		// TODO: define constructor property
		// 
		this.extend = function (_constructor_object) {
			var instance;

			if (!_constructor_object) return null;

			switch (typeof _constructor_object) {
				case 'function':
					_constructor_object.prototype = this;
					instance = new _constructor_object();
					break;

				case 'object':
					instance = this.create();
					instance.mixin(_constructor_object);
					break;

				default:
					console.error('TypeError: Invalid type given for object extention.', typeof _constructor_object);
			}

			return instance;
		};

		this.mixin = function () {
			return util.mixin.apply(null, [this].concat([].slice.call(arguments, 0)));
		};

		this.keyOf = function (_member) {
			return util.keyOf(this, _member);
		};

		this.sup = function () {
			var owner, prototype;

			owner = util.getOwner(this, this.sup.caller);
			prototype = Object.getPrototypeOf(owner.object);

			return prototype[owner.name].apply(this, arguments);
		};

	});

	type('Events', function () {
		var i, method, methods;

		function createProxyFunction (_name) {
			return function () {
				$jq = $();
				$jq.push(this);

				return $.fn[_name].apply($jq, arguments);
			};
		}

		methods = ['on', 'off', 'trigger'];

		for (i=0; method = methods[i]; i+=1) {
			this[method] = createProxyFunction(method);
		}
	});

	type('jQProxy', function () {
		var method, exclude;

		function createProxyFunction (_name) {
			return function () {
				if (!this.$els) {
					console.error('ReferenceError: Unable to invoke', _name, 'because the scope is not initialized.');
					return;
				}

				return $.fn[_name].apply(this.$els, arguments);
			};
		}

		exclude = ['constructor'].concat(Object.keys(Basic));

		this.$els = null;

		for (method in $.fn) {
			if (!$.fn.hasOwnProperty(method) || ~exclude.indexOf(method)) continue;
			this[method] = createProxyFunction(method);
		}
	});

	type('Scope : jQProxy', function () {
		var SCREENS;

		SCREENS = [];

		this.properties = null;

		this.handleProperty = {
			component: function () {
				// body...
			},
			
			action: function () {
				// body...
			}
		};
		
		this.initialize = function (_node_selector) {
			var scope;

			scope = this;

			this.$els = $(_node_selector);

			if (!this.$els.length) {
				console.error('ReferenceError: Unable to locate the element with selector', _node_selector);
				return;
			}

			this.addClass('pl-scope');
			this.data('pl-scope', this);

			

			// NOTE:
			// We may want this performed regardless of game initialization
			// for scopes that are created after game initialization.
			// 
			if (!pl.game.isInitialized) {
				pl.game.queue(this);
				
				this.init();

				pl.game.on('initialized', function () {
					scope.setup();
				});

				pl.game.queue.complete(this, 'initialized');
			}

			else {
				this.init().setup();
			}

			return this;
		};

		this.init = function () {
			console.log('Scope init', this);
			return this.attachEvents();
		};

		this.setup = function () {
			this.captureProperties();

			console.log('Scope setup', this);

			return this;
		};

		this.attachEvents = function () {
			this.on('entity-handle-property', function (_event, _node, _name) {
				console.log('handle', _node, _name);
			});

			return this;
		};

		this.captureProperties = function () {
			var entity, property, $nodes;

			entity = this;
			this.properties = [];

			this.each(function () {
				var i, attr, name;

				for (i=0; attr = this.attributes[i]; i+=1) {
					// I explicitly want it to be at the beginning.
					if (attr.name.indexOf('pl-') === 0) {
						name = attr.name.slice(3);

						entity.properties.push(name);
						entity.properties[name] = this.value;
						entity.trigger('entity-handle-property', [this, name, this.value, this.attributes[i]]);
					}
				}
			});

			if (this.handleProperty) {
				for (property in this.handleProperty) {
					if (!this.handleProperty.hasOwnProperty(property)) continue;

					$nodes = this.find('[pl-'+property+']');

					if ($nodes.length) {
						$nodes.each(function () {
							var attr;

							if (entity.is($(this).closest('.pl-scope'))) {
								attr = this.attributes.getNamedItem('pl-'+property);

								entity.trigger('entity-handle-property', [this, property, attr.value, attr]);
							}
						});
					}
				}
			}

			return this;
		};

		this.screen = function (_index_name, _implementation) {
			if (this.$els) {

			}

			else {
				SCREENS.push({
					index: (typeof _index_name === 'number') ? _index_name : null,
					name: (typeof _index_name === 'string') ? _index_name : null,
					implementation: _implementation
				});
			}
		};

		this.screen.records = {
			get: function (_index_name) {
				var i, record;

				for (i=0; record = SCREENS[i]; i+=1) {
					if (record.index === _index_name || record.name === _index_name) return record;
				}

				return null;
			},

			clear: function (_record) {
				var index;

				if (_record) {
					index = SCREENS.indexOf(_record);
					SCREENS.splice(index, 1);
				}

				else {
					SCREENS = [];	
				}
			}
		};

		this.entity = function (_selector, _implementation) {
			var $els, instance;

			$els = this.find(_selector);
			instance = this.provideEntityPrototype().extend(_implementation);

			instance.ready();
		};

		this.provideEntityPrototype = function () {
			return type.Entity;
		};

	});

	// Global Game scope.
	SCOPE = type('GlobalScope : Scope');

	type('Game : GlobalScope', function () {

		this.screens = null;
		
		this.init = function () {
			this.sup();

			console.log('Game init');

			this.captureScreens();

			return this;
		};

		this.captureScreens = function () {
			var screenSelector, $screens, game;

			game = this;
			screenSelector = pl.game.config('screenSelector');
			$screens = this.find(screenSelector);

			this.screens = [];

			$screens.each(function (_index) {
				var screen, record;

				record = game.screen.records.get(this.id || _index);

				if (record) {
					screen = type.Screen.extend(record.implementation).initialize(this, game);
					game.screen.records.clear(record);
				}

				else {
					screen = type.Screen.create().initialize(this, game);	
				}
				
				if (this.id) game[this.id] = screen;

				game.screens.push(screen);
			});

			game = null;
		};

	});

	type('Entity : GlobalScope', function () {

		this.game = null;
		this.screen = null;

		// this.handleProperty = 
		
		this.initialize = function (_node_selector, _game, _screen) {
			
			console.log('Entity initialize', this);

			if (_game) this.game = _game;
			if (_screen) this.screen = _screen;

			return this.sup(_node_selector);
		};

		this.setup = function () {
			this.sup();
			console.log('Entity setup', this);

			return this;
		};

		this.attachEvents = function () {
			
		};

	});

	type('Screen : Entity', function () {
		
		this.next = function () {
			// body...
		};

		this.prev = function () {
			// body...
		};

	});
	
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

	this.game.component = function () {};
	this.game.component.config = function () {};

	this.type = type;
	this.util = util;

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
});