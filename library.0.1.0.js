/**
*  PlayJS (temporary name)
*  
*  @author Micah Rolon <micah@ginasink.com>
*  @desc A simple and beautiful game development library.
*/

var Play, pl;

Play = pl = (function () {
	
	// eval() wrapper so the scope of the evaluated source
	// is isolated and does not include the library's
	// lexical scope.
	function evalAction (_source, _scope, _errorMessage) {
		var error;

		// expose members of the object as if they were local variables.
		// NOTE: methods still retain their "this" binding to the object! :D
		with (_scope) {
			return eval("try {"+_source+";} catch (error) { console.error('Error:', _errorMessage); }");
		}
	}

	return new (function () {

		var util, Basic, SCOPE;

		// TODO: Implement dot notation parsing for type namespacing.
		// 

		/**
		*  @desc Declares a new object type within the library.
		*  @param _def (String) Defines the name of the type and/or specifies the name of the type which is its prototype.
		*  @param _implementation (Function|Object) Optional. The implementation of the new type as either a constructor function or object to mixin.
		*  @return (Basic) Returns a new type with 'Basic' as its base type.
		*/
		function type (_def, _implementation) {
			var tokens, name, prototype;

			tokens = _def.split(/\s*:\s*/);
			name = tokens[0];
			prototype = tokens[1] && type[tokens[1]];

			// Simply create a new instance if a definition has not been
			return type[name] = _implementation ? (prototype || Basic).extend(_implementation) : (prototype || Basic).create();
		}

		util = new (function () {

			/**
			*  @desc Accepts one or more objects to combine their own properties to single object.
			*  @param _target (Object) The object that will recieve all members.
			*  @param _sources... (Object) The object(s) to join with the '_target'.
			*  @return _target
			*/
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

			/**
			*  @desc Matches the name of the key which references the given pointer inside an object. Like indexOf() for objects.
			*  @param _obj (Object) Object to search in.
			*  @param _member (*) The reference which is expected to be in the object as a property.
			*  @return (String) The name of the key in the object matching '_member'.
			*/
			this.keyOf = function (_obj, _member) {
				var member;

				for (member in _obj) {
					if (!_obj.hasOwnProperty(member)) continue;
					if (_obj[member] === _member) return member;
				}

				return null;
			};

			/**
			*  @desc Matches the object, deep in the prototype chain, which is the owner of the property referencing the given pointer.
			*  @param _obj (Object) The object to search.
			*  @param _member (*) The reference which is expected to be a property in the prototype chain.
			*  @return (Object) An object containing the name of the property and the owning object. {name, object}
			*/
			this.getOwner = function (_obj, _member) {
				var prototype, name;

				prototype = Object.getPrototypeOf(_obj);

				// keep searching until we go as deep as we can go.
				while (prototype) {
					// search for the key in the prototype
					name = util.keyOf(prototype, _member);

					// If we found the key in the prototype then we found
					// our match and we can break out of the loop.
					if (name) break;

					// Otherwise go deeper (thats what she said ;p)
					prototype = Object.getPrototypeOf(prototype);
				}

				return {
					name: name,
					object: prototype
				};
			};

			this.eval = evalAction;

		});

		/**
		*  @desc The base type for all objects which will act as prototypes.
		*/
		Basic = new (function () {
			
			/**
			*  @desc Creates a new object with the current object as its prototype.
			*  @return (Object) The new instance.
			*/
			this.create = function () {
				return Object.create(this);
			};

			/**
			*  @desc Creates a new object using a constructor function or object with the current object as its prototype.
			*  @param _implementation (Function|Object) The implementation of the new type as either a constructor function or object to mixin.
			*  @return (Basic) The new instance.
			*
			*  TODO: define constructor property
			*/
			this.extend = function (_implementation) {
				var instance;

				if (!_implementation) return null;

				switch (typeof _implementation) {
					case 'function':
						_implementation.prototype = this;
						instance = new _implementation();
						break;

					case 'object':
						instance = this.create();
						instance.mixin(_implementation);
						break;

					default:
						console.error('TypeError: Invalid type given for object extention.', typeof _implementation);
				}

				return instance;
			};

			/**
			*  @desc Accepts one or more objects to combine their own properties to the instance.
			*  @param _sources... (Object) The object(s) to join with the '_target'.
			*  @return _target
			*/
			this.mixin = function () {
				return util.mixin.apply(null, [this].concat([].slice.call(arguments, 0)));
			};

			/**
			*  @desc Matches the name of the key which references the given pointer inside the instance. Like indexOf() for objects.
			*  @param _member (*) The reference which is expected to be in the object as a property.
			*  @return (String) The name of the key in the object matching '_member'.
			*/
			this.keyOf = function (_member) {
				return util.keyOf(this, _member);
			};

			/**
			*  @desc Performs a super callback of the function which called it. Allowing you to still invoke a method which was overridden.
			*  @param ... (*) Whatever amount of arguments the caller takes.
			*  @return (*) Whatever the caller returns.
			*/
			this.sup = function () {
				var method, name, owner, prototype;

				// Get the function which invoked sup() in the call stack.
				method = this.sup.caller;

				// Check to see if 'this' owns the method.
				// NOTE: We may want to move this logic into getOwner().
				// 
				if (name = this.keyOf(method)) {
					prototype = Object.getPrototypeOf(this);
				}

				// Otherwise find the object which owns the caller function.
				else {
					owner = util.getOwner(this, method);
					name = owner.name;
					prototype = Object.getPrototypeOf(owner.object);	
				}
				
				method = prototype[name];

				if (!method) {
					console.error('ReferenceError: Unable to locate prototype method.', this.sup.caller);
					return null;
				}

				return method.apply(this, arguments);
			};

		});

		/**
		*  @desc Contains methods for managing and dispatching events from objects.
		*  @proto Basic
		*/
		type('Events', function () {
			var i, method, methods;

			/**
			*  @desc Creates a function with a proxy to the jQuery method.
			*  @param _name (String) The name of the method being proxied.
			*  @return (jQuery|*) Either a jQuery object or whatever the original method returns.
			*  @private
			*/
			function createProxyFunction (_name) {
				return function () {
					$jq = $();
					// We must wrap our object in jQuery. If 'typeof this' is a function then we need
					// to add it in this manner, otherwise jQuery treats it like a ready callback.
					$jq.push(this);

					return $.fn[_name].apply($jq, arguments);
				};
			}

			methods = ['on', 'off', 'trigger'];

			for (i=0; method = methods[i]; i+=1) {
				this[method] = createProxyFunction(method);
			}
		});

		/**
		*  @desc Contains all the jQuery methods targeted towards a property which references a jQuery object.
		*  @proto Basic
		*/
		type('jQProxy', function () {
			var method, exclude;

			/**
			*  @desc Creates a function with a proxy to the jQuery method.
			*  @param _name (String) The name of the method being proxied.
			*  @return (jQuery|*) Either a jQuery object or whatever the original method returns.
			*  @private
			*/
			function createProxyFunction (_name) {
				return function () {
					// This makes sure your not calling any jQuery methods before initialization.
					if (!this.$els) {
						console.error('ReferenceError: Unable to invoke', _name, 'because the scope is not initialized.');
						return;
					}

					return $.fn[_name].apply(this.$els, arguments);
				};
			}

			// We don't want jQuery methods overridding our base type's methods.
			exclude = ['constructor'].concat(Object.keys(Basic));

			this.$els = null;

			for (method in $.fn) {
				if (!$.fn.hasOwnProperty(method) || ~exclude.indexOf(method)) continue;
				this[method] = createProxyFunction(method);
			}
		});

		/**
		*  @desc Scopes are packages which contain a reference to a DOM element wrapped in a jQuery object.
		*        This enables properties and methods to be in context of the DOM node and its descendants.
		*  @proto jQProxy
		*/
		type('Scope : jQProxy', function () {

			function getRecordBy (_key, _member, _collection) {
				var i, record;

				if (_collection) {
					for (i=0; record = _collection[i]; i+=1) {
						if (record[_key] === _member) return record;
					}
				}

				return null;
			}

			function removeRecord (_record, _collection) {
				var index;

				index = _collection.indexOf(_record);
				if (~index) _collection.splice(index, 1);
			}

			function transformId (_id) {
				return _id.replace(/[-\s]+/g, '_');
			}

			this.screens = null;
			this.entities = null;
			this.properties = null;
			this.propertyHandlers = null;
			
			this.initialize = function (_node_selector) {
				var scope;

				scope = this;

				this.$els = (_node_selector.jquery) ? _node_selector : $(_node_selector);

				if (!this.$els.length) {
					console.error('ReferenceError: Unable to locate the element with selector', this.$els.selector);
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
				return this
					.attachEvents()
					.initializeEntities()
					.captureScreens();
			};

			this.setup = function () {
				return this.captureProperties();
			};

			this.attachEvents = function () { return this; };

			this.captureScreens = function () {
				var scope, screenSelector, prototype;

				if (!this.hasOwnProperty('screens')) return this;

				scope = this;
				screenSelector = pl.game.config('screenSelector');
				prototype = (type.Screen.isPrototypeOf(this)) ? this : type.Screen;
				
				this.find(screenSelector).each(function (_index) {
					var screen, record, key, id, index;

					// Skip screens that are nested. They will be initialized by their parent scope.
					if (!scope.is($(this).closest('.pl-scope'))) return;

					key = (this.id) ? (id = this.id, 'name') : (id = _index, 'index');

					record = getRecordBy(key, id, scope.screens);

					if (record) {
						index = scope.screens.indexOf(record);
						screen = prototype.extend(record.implementation).initialize(this);
						scope.screens[index] = screen;
					}

					else {
						screen = prototype.create().initialize(this);
						scope.screens.push(screen);
					}

					screen.screen = screen;
					
					if (this.id) scope[transformId(this.id)] = screen;
				});

				scope = null;

				return this;
			};

			this.initializeEntities = function () {
				var scope;

				if (!this.hasOwnProperty('entities')) return this;

				scope = this;

				this.entities.forEach(function (_record, _index) {
					var instance, id;

					instance = scope.extend(_record.implementation).initialize(scope.find(_record.selector));
					id = transformId(instance.attr('id'));
					scope.entities[_index] = instance;
					if (id) scope[id] = instance;;
				});

				return this;
			};

			this.captureProperties = function () {
				var scope, property, collection, $nodes, handler;

				scope = this;
				collection = [];

				this.each(function () {
					var i, attr, name;

					for (i=0; attr = this.attributes[i]; i+=1) {
						// I explicitly want it to be at the beginning.
						if (attr.name.indexOf('pl-') === 0) {
							name = attr.name.slice(3);
							handler = scope.propertyHandlers[name];
							collection[transformId(name)] = attr.value;

							collection.push(name);
							if (handler) handler.call(scope, this, name, attr.value, attr);
						}
					}
				});

				if (collection.length) this.properties = collection;

				if (this.propertyHandlers) {
					for (property in this.propertyHandlers) {
						// only exclide members on the base type
						if (Basic.hasOwnProperty(property)) continue;

						handler = this.propertyHandlers[property];
						$nodes = this.find('[pl-'+property+']');

						if ($nodes.length) {
							$nodes.each(function () {
								var attr;

								if (scope.is($(this).closest('.pl-scope'))) {
									attr = this.attributes.getNamedItem('pl-'+property);
									if (handler) handler.call(scope, this, property, attr.value, attr);
								}
							});
						}
					}
				}

				return this;
			};

			this.handleProperty = function (_implementation) {
				if (this.hasOwnProperty('propertyHandlers')) {
					switch (typeof _implementation) {
						case 'function':
							_implementation.call(this.propertyHandlers);
							break;

						case 'object':
							this.propertyHandlers.mixin(_implementation);
							break;
					}
				}

				else if (this.propertyHandlers) {
					this.propertyHandlers = this.propertyHandlers.extend(_implementation);
				}

				else {
					this.propertyHandlers = Basic.extend(_implementation);
				}

				return this;
			};

			this.screen = function (_id, _implementation) {
				var prototype, selector, screenSelector, instance;

				if (!this.hasOwnProperty('screens')) this.screens = [];

				if (this.$els) {
					screenSelector = pl.game.config('screenSelector');
					prototype = (type.Screen.isPrototypeOf(this)) ? this : type.Screen;
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

			this.entity = function (_selector, _implementation) {
				if (!this.hasOwnProperty('entities')) this.entities = [];

				if (this.$els) {

				}

				else {
					this.entities.push({
						selector: _selector,
						implementation: _implementation
					});
				}

				return this;
			};

			this.provideEntityPrototype = function () {
				return type.Entity;
			};

		});

		// Global Game scope.
		SCOPE = type('GlobalScope : Scope');

		type('Game : GlobalScope', function () {

			this.setup = function () {
				var game;

				game = this;

				this.screens.forEach(function (_screen) {
					_screen.game = game;
				});

				this.addClass('pl-game');

				return this;
			};

		});

		type('Entity : GlobalScope', function () {

			var Actionables;

			function attachActionHandler () {
				var entity;

				entity = this;

				this.on(pl.EVENT.CLICK, function (_event) {
					var target, record;

					target = $(_event.target).closest('[pl-action]')[0];

					if (target) {
						record = entity.actionables.item(target);

						if (record) {
							pl.util.eval(record.action, entity);
						}
					}
				});
			}

			Actionables = (function () {

				util.mixin(this, Basic);

				this.add = function (_node, _action) {
					if (!this.has(_node)) {
						this.push({
							node: _node,
							action: _action
						});
					}

					return this;
				};

				this.remove = function (_node) {
					var item, index;

					item = this.item(_node);
					index = this.indexOf(item);
					if (~index) this.splice(index, 1);

					return this;
				};

				this.item = function (_node) {
					var i, item;

					for (i=0; item = this[i]; i+=1) {
						if (item.node === _node) return item;
					}
				}

				this.has = function (_node) {
					return !!this.item(_node);
				};

				return this;

			}).call([]);

			this.handleProperty(function () {

				this.action = function (_node, _name, _value, _property) {
					if (!this.actionables) {
						this.actionables = Actionables.create();
						attachActionHandler.call(this);	
					}

					this.actionables.add(_node, _value);
				};

			});

			this.actionables = null;

			this.provideEntityPrototype = function () {
				console.log('Entity prototype', this);
				return this;
			};

		});

		type('Screen : Entity', function () {

			this.handleProperty(function () {
				
				this.component = function (_node, _name, _value, _property) {
					var record;

					// record = pl.game.component.get(_value);

					console.log('--handleProperty', this, _node, record );

				};

			});
			
			this.game = null;
			this.screen = null;

			this.next = function () {
				console.log('Screen next()');
			};

			this.prev = function () {
				console.log('Screen prev()');
			};

		});

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
}());	