/**
*  Scope
*  @desc Scopes are packages which contain a reference to a DOM element wrapped in a jQuery object.
*        This enables properties and methods to be in context of the DOM node and its descendants.
*  @proto jQProxy
*/
import jQProxy from 'types/jQProxy';
import Basic from 'types/Basic';
import game from 'play.game';
import Queue from 'types/Queue';

export default jQProxy.extend(function () {

	var Scope;

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

	Scope = this;

	this.isReady = false;
	this.screens = null;
	this.entities = null;
	this.properties = null;
	this.propertyHandlers = null;
	this.assetQueue = null;
	
	this.initialize = function (_node_selector, _isComponent) {
		var scope;

		scope = this;
		this.$els = (_node_selector.jquery) ? _node_selector : $(_node_selector);

		if (!this.$els.length) {
			console.error('ReferenceError: Unable to locate the element with selector', this.$els.selector);
			return;
		}

		this.addClass('pl-scope');
		this.data('pl-scope', this);
		this.data('pl-component', _isComponent);

		// NOTE:
		// We may want this performed regardless of game initialization
		// for scopes that are created after game initialization.
		// 
		if (!game.isInitialized) {
			game.queue(this);
			
			this.init();

			game.on('initialized', function done () {
				scope.setup();
				game.off('initialized');
			});

			game.queue.complete(this, 'initialized');
		}

		else {
			this.init().setup();
		}

		return this;
	};

	this.init = function () {
		this.assetQueue = Queue.create();

		return this
			.attachEvents()
			.initializeEntities()
			.captureScreens();
	};

	this.setup = function () {
		console.log('setup');
		this
			.watchAssets()
			.captureProperties();

		this.assetQueue.ready();

		return this;
	};

	this.ready = function () {
		console.log('scope ready', this);
		this.isReady = true;
		this.addClass('READY');
		this.trigger('ready');
		return this;
	};

	this.loadComponentAssets = function (_name, _callback) {
		var scope, path;

		function ready () {
			ready.status +=1;

			if (ready.status === 2) {
				if (_callback) {
					_callback.call(scope, _name);
					scope.assetQueue.ready(_name);
				}
			}
		}

		scope = this;
		path = game.config('componentDirectory')+_name+'/';
		ready.status = 0;

		this.load(path+'template.html', ready);

		$('<style type="text/css" pl-component="'+_name+'">')
			.load(path+'style.css', function () {
				$(document.body).append(this);
				scope.watchAssets();
				ready();
			});

		this.assetQueue.add(_name);

		return this;
	};

	this.watchAssets = function () {
		var scope;

		scope = this;

		console.log('watchAssets()');

		this.find('img, audio, video').each(function () {
			var $node;

			$node = $(this);

			console.log('watch', this.nodeName, this.src);

			// Skip screens that are nested. They will be initialized by their parent scope.
			if (scope.is($node.closest('.pl-scope'))) {
				switch (this.nodeName) {
					case 'IMG':
						if (this.complete) {
							console.log('already complete', this.src);
							return;
						}

						scope.assetQueue.add(this.src);
						console.log('track image', this.src);

						this.onload = (function (_node) {
							return function (_event) {
								scope.assetQueue.ready(_node.src);
								console.log('** image load', this.src);
								scope.trigger('loaded', [_node]);
							};
						}(this));
						break;
								
				}
			}
		});

		return this;
	};

	this.attachEvents = function () {
		var scope;

		scope = this;

		this.assetQueue.on('complete', function () {
			console.log('** assetQueue complete', scope);
			scope.ready();
		});

		this.on('init', function () {
			console.log('initialized');
			scope.off('init');
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
			var screen, record, key, id, index, component;

			// Skip screens that are nested. They will be initialized by their parent scope.
			if (!scope.is($(this).closest('.pl-scope'))) return;

			key = (this.id) ? (id = this.id, 'name') : (id = _index, 'index');
			component = $(this).attr('pl-component');
			index = -1;

			if (component) {
				record = pl.game.component.get(component);

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
				screen = prototype.extend(record.implementation).initialize(this, !!component);

				if (~index) {
					scope.screens[index] = screen;
				}

				else {
					scope.screens.splice(_index, 0, screen);
				}
			}

			else {
				console.log('empty screen', this);
				screen = prototype.create().initialize(this);
				scope.screens.splice(_index, 0, screen);;
			}

			screen.screen = screen;
			
			if (this.id||component) scope[transformId(this.id||component)] = screen;
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

			if (!Scope.isPrototypeOf(_record)) {
				instance = scope.extend(_record.implementation).initialize(scope.find(_record.selector));
				scope.entities[_index] = instance;
			}

			else {
				instance = _record;
			}

			
			id = transformId(instance.attr('id'));
			if (id) scope[id] = instance;
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
			id = transformId(instance.attr('id'));

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
			var self;

			self = this;

			this.loadComponentAssets(_value, function () {
				var record, scope, id;

				if (!$(_node).data('pl-component')) {
					record = pl.game.component.get(_value);
					scope = this.extend(record.implementation).initialize(_node, true);
					id = scope.attr('id') || _value;
					this[id] = scope;

					// this.assetQueue.add(scope);
					// scope.on('ready', function () {
					// 	self.assetQueue.ready(scope);
					// });
				}
			});
		};

	});

});