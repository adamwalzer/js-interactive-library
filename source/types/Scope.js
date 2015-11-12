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

function createEntity (_$node, _implementation) {
	var component, prototype, componentRecord, instance;

	component = _$node.attr('pl-component');
	prototype = this;

	if (component) {
		componentRecord = game.component.get(component);

		if (componentRecord) {
			prototype = this.extend(componentRecord.implementation);
		}

		else {
			throw new Error('No implementation record for the '+component+'component.');
		}
	}

	instance = typeof _implementation === 'function' ? prototype.extend(_implementation) : prototype.create();

	return instance.initialize(_$node, component);
}

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
	function loadComponentAssets (_name, _callback) {
		var scope, path, totalRequests, transclideMode;

		function ready () {
			ready.status +=1;

			if (ready.status === totalRequests) {
				if (_callback) {
					_callback.call(scope, _name);
					// scope.assetQueue.ready(_name);
				}
			}
		}

		totalRequests = 0;
		scope = this;
		path = game.config('componentDirectory')+_name+'/';
		transclideMode = this.properties.transclide || this.TRANSCLIDE_REPLACE;
		ready.status = 0;

		if (!this.children().length || ~[this.TRANSCLIDE_APPEND, this.TRANSCLIDE_PREPEND].indexOf(transclideMode)) {
			totalRequests+=1;
			$('<div>').load(path+'template.html', function () {
				var memory;

				memory = [];

				if (transclideMode === scope.TRANSCLIDE_APPEND) {
					scope.append(this.children);
				}

				else if (transclideMode === scope.TRANSCLIDE_PREPEND) {
					scope.prepend(this.children);
				}

				else {
					scope.html(this.innerHTML);
				}

				scope.find('[pl-component]').each(function () {
					var name;

					name = $(this).attr('pl-component');

					if (~memory.indexOf(name)) return;

					memory.push(name);

					totalRequests+=1;
					// scope.assetQueue.add(name);

					game.component.load(name, function () {
						// scope.assetQueue.ready(name);
						ready();
					});
				});
				ready();
			});
		}

		if (!$('style[pl-for-component="'+_name+'"]').length) {
			totalRequests+=1;
			$('<style type="text/css" pl-for-component="'+_name+'">')
				.load(path+'style.css', ready)
				.appendTo(document.body);
		}

		// if (totalRequests) this.assetQueue.add(_name);

		return this;
	}

	function captureProperties () {
		var i, attr, name, collection;

		collection = (function () {
			
			this.has = function (_name) {
				return !!~this.indexOf(_name);
			};

			return this;

		}).call([]);

		for (i=0; attr = this.$els[0].attributes[i]; i+=1) {
			// I explicitly want it to be at the beginning.
			if (attr.name.indexOf('pl-') === 0) {
				name = attr.name.slice(3);
				collection[transformId(name)] = attr.value;
				
				collection.push(name);
			}
		}

		if (collection.length) this.properties = collection;

		return this;
	}

	function initializeEntities () {
		if (!this.hasOwnProperty('entities')) return this;

		this.entities.forEach(this.bind(function (_record, _index) {
			var $node, instance, id;

			$node = this.find(_record.selector);

			if (!Scope.isPrototypeOf(_record)) {
				instance = createEntity.call(this, $node, _record.implementation);
				this.entities[_index] = instance;

				if (!instance.isReady) {
					this.assetQueue.add(instance);
				}
				
			}

			else {
				instance = _record;
			}
			
			id = transformId(instance.id());
			if (id) this[id] = instance;
		}));

		return this;
	}

	function handleProperties () {
		var scope, property, handler;

		scope = this;

		if (this.hasOwnProperty('properties')) {
			this.properties.forEach(function (_name) {
				handler = scope.propertyHandlers[_name];
				if (handler) handler.call(scope, scope.$els[0], _name, scope.properties[_name]);
			});
		}

		if (this.propertyHandlers) {
			for (property in this.propertyHandlers) {
				// only exclide members on the base type
				if (Basic.hasOwnProperty(property)) continue;

				handler = this.propertyHandlers[property];

				this.find('[pl-'+property+']').each(function () {
					var attr;

					if (scope === $(this).scope()) {
						attr = this.attributes.getNamedItem('pl-'+property);

						if (handler) handler.call(scope, this, property, attr.value);
					}
				});
			}
		}

		return this;
	}

	function invokeLocal (_name) {
		var args, owner;

		args = [].slice.call(arguments, 1);

		if (this.isMemberSafe(_name)) {
			return this[_name].apply(this, arguments);
		}
	}

	function init () {
		invokeLocal.call(this, 'willInit');

		this.attachEvents();

		initializeEntities.call(this);
		handleProperties.call(this);

		this.watchAssets();
		this.captureAudioAssets();
		this.captureReferences();

		this.__init();
		invokeLocal.call(this, 'init');

		if (!this.isReady) this.assetQueue.ready();

		return this;
	}

	function ready () {
		var readyEvent;

		readyEvent = $.Event('ready', { targetScope: this });

		this.isReady = true;
		this.addClass('READY');
		this.trigger(readyEvent);

		this.__ready();
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
		};

		this.has = function (_node) {
			return !!this.item(_node);
		};

		return this;

	}).call([]);

	this.TRANSCLIDE_REPLACE = 'replace';
	this.TRANSCLIDE_PREPEND = 'prepend';
	this.TRANSCLIDE_APPEND = 'append';

	this.baseType = 'TYPE_SCOPE';
	this.actionables = null;
	this.isReady = null;
	this.isComponent = false;
	this.entities = null;
	this.audio = null;
	this.properties = null;
	this.propertyHandlers = null;
	this.assetQueue = null;
	
	this.initialize = function (_node_selector, _componentName) {
		var scope;

		scope = this;

		this.isReady = false;
		this.assetQueue = Queue.create();
		this.$els = (_node_selector.jquery) ? _node_selector : $(_node_selector);

		if (_componentName) this.isComponent = true;
		if (!this.$els.length) {
			throw new ReferenceError('Unable to locate the element with selector '+this.$els.selector+'.');
		}

		this.addClass('pl-scope '+(_componentName ? _componentName+'-component' : ''));
		this.data('pl-scope', this);
		this.data('pl-isComponent', !!_componentName);

		captureProperties.call(this);
		
		if (_componentName) {
			loadComponentAssets.call(this, _componentName, function () {
				init.call(this);
			});
		}
		
		else {
			init.call(this);
		}

		return this;
	};

	// only for use in base types
	this.__init = function () { return this; };
	this.__ready = function () { return this; };

	this.willInit = function () { return this; };
	this.init = function () { return this; };
	this.ready = function () { return this; };

	this.watchAssets = function () {
		var scope, assetTypes;

		function watch () {
			var eventMap, isNodeComplete;

			function createHandler (_node) {
				return function () {
					var loadedEvent;

					loadedEvent = $.Event('loaded', { targetScope: scope });
					scope.assetQueue.ready(_node.src);
					scope.trigger(loadedEvent, [_node]);
				};
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
				// console.log('watch', this.nodeName, this.src, scope.id());
				this[eventMap[this.nodeName]] = createHandler(this);
				this.onerror = function () {
					console.error('Image failed to load', this.src);
				};
			}
		}

		// console.log('watchAssets', this.id(), this.html())

		scope = this;
		assetTypes = ['IMG', 'AUDIO', 'VIDEO'];

		this.each(function () {
			if (~assetTypes.indexOf(this.nodeName)) {
				watch.call(this);
			}
		});

		this.findOwn(assetTypes.join(',')).each(function () {
			watch.call(this);
		});

		return this;
	};

	this.attachEvents = function () {
		var scope;

		this.proto();

		scope = this;

		this.assetQueue.on('complete', function () {
			scope.assetQueue.off();
			ready.call(scope);
		});

		this.on('ready', function (_event) {
			// console.log('* ready:', this.id()||this.address(), ', target:', _event.targetScope.id());

			if (this.has(_event.targetScope.$els) && this.assetQueue.has(_event.targetScope)) {
				// console.log('** update queue', this.assetQueue.length, this.assetQueue.join(', '));
				this.assetQueue.ready(_event.targetScope);
			}

			if (!this.assetQueue.length) this.off('ready');
		});

		return this;
	};

	this.captureReferences = function () {
		this.findOwn('[id], [pl-id]').each(this.bind(function (_index, _node) {
			var $node, id;

			$node = $(_node);
			id = $node.attr('id') || $node.attr('pl-id');

			if (!this[id]) {
				this[id] = $node.data('pl-scope') || $node;
			}
		}));
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

	// Wraps you function 'this' to the scope.
	// 
	this.bind = function (_handler) {
		var scope;

		scope = this;

		return function () {
			return _handler.apply(scope, arguments);
		};
	};

	this.isMemberSafe = function (_name) {
		var owner;

		if (this[_name] == null) return false;
		if (this.hasOwnProperty(_name)) return true;

		owner = util.getOwner(this, this[_name]);

		if (Object.getPrototypeOf(this) === owner.object && !owner.object.hasOwnProperty('$els')) {
			return true;
		}

		return false;
	};

	this.toString = function () {
		var type;

		type = this.baseType.replace('TYPE_', '');
		type = type.slice(0,1)+type.slice(1).toLowerCase();

		return ['[', this.id() || this.address(), ' ', type, ']'].join('');
	};

	this.has = function (_child) {
		var child;

		child = Scope.isPrototypeOf(_child) ? _child.$els : _child;

		return !!this.$els.has(child);
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

export default { Scope, createEntity };