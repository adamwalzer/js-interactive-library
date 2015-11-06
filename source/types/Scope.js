/**
*  Scope
*  @desc Scopes are packages which contain a reference to a DOM element wrapped in a jQuery object.
*        This enables properties and methods to be in context of the DOM node and its descendants.
*  @proto jQProxy
*/
import jQProxy from 'types/jQProxy';
import Basic from 'types/Basic';
import Queue from 'types/Queue';
import game from 'play.game';
import util from 'util';
import evalAction from 'evalAction';

var Scope = jQProxy.extend(function () {

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
					evalAction(record.action, entity);
				}
			}
		});
	}

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
		return _id && _id.replace(/[-\s]+/g, '_');
	}

	// Protected
	function invokeLocal (_name) {
		var args;

		args = [].slice.call(arguments, 1);

		if (this.hasOwnProperty(_name)) {
			return this[_name].apply(this, arguments);
		}
	}

	function init () {
		this.assetQueue = Queue.create();

		return this
			.attachEvents()
			.initializeEntities()
			.captureScreens();
	}

	function ready () {
		var readyEvent;

		readyEvent = $.Event('ready', { targetScope: this });

		this.isReady = true;
		this.addClass('READY');
		this.trigger(readyEvent, [this]);
		invokeLocal.call(this, 'ready');
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

	this.baseType = 'TYPE_SCOPE';
	this.actionables = null;
	this.isReady = false;
	this.isComponent = false;
	this.screens = null;
	this.entities = null;
	this.audio = null;
	this.properties = null;
	this.propertyHandlers = null;
	this.assetQueue = null;
	
	this.initialize = function (_node_selector, _componentName) {
		var scope;

		scope = this;
		this.$els = (_node_selector.jquery) ? _node_selector : $(_node_selector);
		if (_componentName) this.isComponent = true;

		if (!this.$els.length) {
			console.error('ReferenceError: Unable to locate the element with selector', this.$els.selector);
			return;
		}

		this.addClass('pl-scope '+(_componentName ? _componentName+'-component' : ''));
		this.data('pl-scope', this);
		this.data('pl-isComponent', !!_componentName);

		// NOTE:
		// We may want this performed regardless of game initialization
		// for scopes that are created after game initialization.
		// 
		if (!game.isInitialized) {
			game.queue(this);
			
			invokeLocal.call(this, 'willInit');
			init.call(this);
			invokeLocal.call(this, 'init');

			game.on('initialized', function done () {
				if (scope.isComponent) {
					scope.loadComponentAssets(_componentName, function () {
						this.setup();
					});
				}

				else {
					scope.setup();
					scope.assetQueue.ready();
				}
				game.off('initialized');
			});

			game.queue.complete(this, 'initialized');
		}

		else {
			this.init().setup();
		}

		return this;
	};

	this.initializeEntities = function () {
		var scope;

		if (!this.hasOwnProperty('entities')) return this;

		scope = this;

		this.entities.forEach(function (_record, _index) {
			var $node, component, componentRecord, instance, id, prototype;

			$node = scope.find(_record.selector);
			component = $node.attr('pl-component');
			prototype = scope;

			if (component) {
				componentRecord = game.component.get(component);

				if (componentRecord) {
					prototype = scope.extend(componentRecord.implementation);
				}

				else {
					console.error('Error: No implementation record for the', component, 'component.');
					debugger;
				}
			}

			if (!Scope.isPrototypeOf(_record)) {
				instance = prototype.extend(_record.implementation).initialize($node, component);
				scope.entities[_index] = instance;
				scope.assetQueue.add(instance);
			}

			else {
				instance = _record;
			}
			
			id = transformId(instance.id());
			if (id) scope[id] = instance;
		});

		return this;
	};

	this.willInit = function () { return this; };
	this.init = function () { return this; };

	this.setup = function () {
		return this
			.watchAssets()
			.captureProperties();
	};

	this.ready = function () { return this; };

	this.loadComponentAssets = function (_name, _callback) {
		var scope, path, totalRequests;

		function ready () {
			ready.status +=1;

			if (ready.status === totalRequests) {
				if (_callback) {
					_callback.call(scope, _name);
					scope.assetQueue.ready(_name);
				}
			}
		}

		totalRequests = 2;
		scope = this;
		path = game.config('componentDirectory')+_name+'/';
		ready.status = 0;

		this.load(path+'template.html', function () {
			var memory;

			memory = [];

			this.find('[pl-component]').each(function () {
				var name;

				name = $(this).attr('pl-component');

				if (~memory.indexOf(name)) return;

				memory.push(name);

				totalRequests+=1;
				scope.assetQueue.add(name);

				game.component.load(name, function () {
					scope.assetQueue.ready(name);
					ready();
				});
			});
			ready();
		});

		if (!$('style[pl-for-component="'+_name+'"]').length) {
			$('<style type="text/css" pl-for-component="'+_name+'">')
				.load(path+'style.css', ready)
				.appendTo(document.body);
		}

		this.assetQueue.add(_name);

		return this;
	};

	this.watchAssets = function () {
		var scope, assetTypes;

		function watch () {
			var eventMap, isNodeComplete;

			function createHandler (_node) {

				return function () {
					var loadedEvent;

					loadedEvent = $.Event('loaded', { targetScope: scope });
					scope.assetQueue.ready(_node.src);
					scope.trigger(loadedEvent, [_node, scope]);
				}
			}

			eventMap = {
				AUDIO: 'onloadeddata',
				IMG: 'onload'
			};

			isNodeComplete = {
				AUDIO: this.readyState === this.HAVE_ENOUGH_DATA,
				IMG: this.complete
			};

			// console.log('found asset', this.nodeName);

			if (isNodeComplete[this.nodeName]) return;
			if (scope.assetQueue.add(this.src)) {
				// console.log('watch', this.nodeName, this.src, scope);
				this[eventMap[this.nodeName]] = createHandler(this);
			}
		}

		scope = this;
		assetTypes = ['IMG', 'AUDIO', 'VIDEO'];

		this.each(function () {
			if (~assetTypes.indexOf(this.nodeName)) {
				watch.call(this);
			}
		});

		this.find(assetTypes.join(',')).each(function () {
			// Skip scopes that are nested. They will be initialized by their parent scope.
			if (scope === $(this).scope()) {
				watch.call(this);
			}
		});

		return this;
	};

	this.attachEvents = function () {
		var scope;

		scope = this;

		this.assetQueue.on('complete', function () {
			scope.assetQueue.off();
			ready.call(scope);
		});

		this.on('ready', function (_event) {
			if (this.has(_event.targetScope.$els) && this.assetQueue.has(_event.targetScope)) {
				this.assetQueue.ready(_event.targetScope);

				if (!this.assetQueue.length) this.off('ready');
			}
		});

		return this;
	};

	this.captureScreens = function () {
		var Screen, scope, screenSelector, prototype;

		if (!this.hasOwnProperty('screens')) return this;

		scope = this;
		Screen = game.provideScreenType();
		screenSelector = pl.game.config('screenSelector');
		prototype = (Screen.isPrototypeOf(this)) ? this : Screen;
		
		this.find(screenSelector).each(function (_index) {
			var $node, screen, record, key, id, index, component;

			// Skip screens that are nested. They will be initialized by their parent scope.
			if (!scope === $(this).scope()) return;

			$node = $(this);
			id = $node.id();
			key = (id) ? 'name' : (id = _index, 'index');
			component = $node.attr('pl-component');
			index = -1;

			if (component) {
				record = game.component.get(component);

				if (!record) {
					console.error('Error: Faild to load component', component);
					return;
				}
			}

			else {
				record = getRecordBy(key, id, scope.screens);
				index = scope.screens.indexOf(record);
			}

			if (record) {
				screen = prototype.extend(record.implementation).initialize(this, component);

				if (~index) {
					scope.screens[index] = screen;
				}

				else {
					scope.screens.splice(_index, 0, screen);
				}
			}

			else {
				screen = prototype.create().initialize(this);
				scope.screens.splice(_index, 0, screen);;
			}

			screen.screen = screen;
			
			if (id||component) scope[transformId(id||component)] = screen;
		});

		scope = null;

		return this;
	};

	this.captureProperties = function () {
		var scope, property, collection, handler;

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

				this.find('[pl-'+property+']').each(function () {
					var attr;

					if (scope === $(this).scope()) {
						attr = this.attributes.getNamedItem('pl-'+property);

						if (handler) handler.call(scope, this, property, attr.value, attr);
					}
				});
			}
		}

		return this;
	};

	this.captureAudioAssets = function () {
		var scope, map;

		scope = this;
		map = {
			background: 'background',
			'voice-over': 'voiceOver'
		};

		this.findOwn('audio').each(function () {
			var $node, id, audioTypes;

			if (!scope.hasOwnProperty('audio')) {
				scope.audio = {
					background: [],
					voiceOver: []
				};
			}

			$node = $(this);
			id = transformId($node.id());
			audioTypes = ['background', 'voice-over'];

			audioTypes.forEach(function (_type) {
				if ($node.hasClass(_type)) {
					$node.on('play pause ended', function (_event) {
						switch (_event.type) {
							case 'play':
								scope.addClass('PLAYING '+_type.toUpperCase());
								break;

							case 'puase':
							case 'ended':
								scope.removeClass('PLAYING '+_type.toUpperCase());
								break;
						}
						scope.trigger($.Event('audio-'+_event.type, { target: $node[0], targetScope: scope, audioType: _type }));
					});

					scope.audio[map[_type]].push($node[0]);

					if (id) scope.audio[map[_type]][id] = $node[0];
				}
			});
		});

		return this;
	};

	this.handleProperty = function (_implementation) {
		if (this.propertyHandlers) {
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

			else {
				this.propertyHandlers = this.propertyHandlers.extend(_implementation);
			}
		}

		else {
			this.propertyHandlers = Basic.extend(_implementation);
		}

		return this;
	};

	this.screen = function (_id, _implementation) {
		var Screen, prototype, selector, screenSelector, instance;

		Screen = game.provideScreenType();

		if (!this.hasOwnProperty('screens')) this.screens = [];

		if (this.hasOwnProperty('$els')) {
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

	this.entity = function (_selector, _implementation) {
		var Entity, prototype, id;

		Entity = game.provideEntityType();

		if (!this.hasOwnProperty('entities')) this.entities = [];

		if (this.hasOwnProperty('$els')) {
			prototype = (Entity.isPrototypeOf(this)) ? this : Entity;
			instance = prototype.extend(_implementation).initialize(this.find(_selector));
			id = transformId(instance.id());

			this.entities.push(instance);
			if (id) this[id] = instance;
		}

		else {
			this.entities.push({
				selector: _selector,
				implementation: _implementation
			});
		}

		return this;
	};

	this.handleProperty(function () {
		
		this.component = function (_node, _name, _value, _property) {
			var self, record, scope, id;

			if (!$(_node).data('pl-isComponent')) {
				self = this;
				record = game.component.get(_value);

				if (record) {
					scope = this.extend(record.implementation).initialize(_node, _value);
					id = transformId(scope.id()) || _value;
					this[id] = scope;

					this.assetQueue.add(scope);
					// scope.on('ready', function () {
					// 	self.assetQueue.ready(scope);
					// 	this.off('ready');
					// });
				}
				
				else {
					debugger;
				}
			}
		};

		this.action = function (_node, _name, _value, _property) {
			if (!this.hasOwnProperty('actionables')) {
				this.actionables = Actionables.create();
				attachActionHandler.call(this);	
			}

			this.actionables.add(_node, _value);
		};

	});

});

export default Scope;