/**
 * Scopes are packages which contain a reference to a DOM element wrapped in a jQuery object.
 * This enables properties and methods to be in context of the DOM node and its descendants.
 *
 * @module
 * @requires types/jQProxy
 * @requires types/Basic
 * @requires types/Queue
 * @requires play.game
 * @requires util
 * @requires evalAction
 *
 * @exports createEntity
 */
import jQProxy from 'types/jQProxy';
import Basic from 'types/Basic';
import Queue from 'types/Queue';
import { Point } from 'types/Dimensions';
import game from 'play.game';
import util from 'util';
import evalAction from 'evalAction';

/**
 * Creates a new Enitiy instance with a context node and implementation.
 * The instance is prototyped from the parent scope.
 *
 * @memberof module:types/Scope~Scope#createEntity
 * @protected
 * @arg {jQuery} _$node - jQuery object with a single node in the collection.
 * @arg {function|object} _implementation - Constructor function or object with the entity behavior.
 * @returns {module:types/Scope~Scope}
 */
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

/**
 * <span class="important">NOTE:</span> This is NOT a constructor. Use `Scope.create()` to get a new instance.
 * @classdesc A package which contains a reference to a DOM node wrapped in a jQuery object. For more information on scopes read [this]{@link module:types/Scope}.
 * @class
 * @extends module:types/jQProxy~jQProxy
 */
var Scope = jQProxy.extend(function () {

	/**
	 * Collection of records pairing a node with its action.
	 * @memberof module:types/Scope~Scope
	 * @static
	 * @protected
	 * @todo Convert to types/Collection
	 */
	var Actionables;

	function attachActionHandler () {
		var entity;

		entity = this;

		this.on(pl.EVENT.CLICK, function (_event) {
			var target, record;

			target = $(_event.target).closest('[pl-action]')[0];
			// TODO: Resolve for touches
			_event.cursor = Point.create().set(_event.clientX, _event.clientY);

			if (target) {
				record = entity.actionables.item(target);

				if (record) {
					_event.targetScope = entity;
					entity.event = _event;
					evalAction(record.action, entity);
					entity.event = null;
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

	function captureDropables (_scope) {
		var collection;

		collection = [];

		_scope.find('> [pl-pluck]').each(function () {
			var name;

			name = $(this).attr('pl-pluck');

			collection.push(this);
			collection[name] = this;
		});

		return collection;
	}

	function pluckAndDrop (_dropables, _template) {
		$(_template).find('[pl-drop]').each(function () {
			var $node, name, dropable;

			$node = $(this);
			name = $node.attr('pl-drop');
			dropable = _dropables[name];

			if (dropable) {
				$node.replaceWith(dropable.children);
			}
		});
	}

	// Protected
	function loadComponentAssets (_name, _callback) {
		var scope, path, totalRequests, transcludeMode, dropables;

		function ready () {
			ready.status +=1;

			if (ready.status === totalRequests) {
				if (_callback) {
					_callback.call(scope, _name);
				}
			}
		}

		totalRequests = 0;
		scope = this;
		path = game.config('componentDirectory')+_name+'/';
		dropables = captureDropables(this);
		transcludeMode = dropables.length ? this.TRANSCLUDE_PLUCK : this.properties.transclude;
		ready.status = 0;

		if (!this.children().length || transcludeMode) {
			totalRequests+=1;
			$('<div>').load(path+'template.html', function () {
				var memory;

				memory = [];

				switch (transcludeMode) {
					case scope.TRANSCLUDE_APPEND:
						scope.append(this.children);
						break;

					case scope.TRANSCLUDE_PREPEND:
						scope.prepend(this.children);
						break;
						
					case scope.TRANSCLUDE_PLUCK:
						pluckAndDrop(dropables, this);
						scope.empty().append(this.children);
						break;

					case scope.TRANSCLUDE_REPLACE:
						scope.empty().append(this.children);
						break;

					default:
						if (transcludeMode) {
							pluckAndDrop(new (function () {
								this[transcludeMode] = scope.node();
							}), this);
							scope.empty().append(this.children);
						}

						else {
							scope.empty().append(this.children);
						}
						
				}

				scope.find('[pl-component]').each(function () {
					var name;

					name = $(this).attr('pl-component');

					if (~memory.indexOf(name)) return;

					memory.push(name);

					totalRequests+=1;

					game.component.load(name, function () {
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

		if (!totalRequests) _callback && _callback.call(this, _name);

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
				collection[util.transformId(name)] = attr.value;
				
				collection.push(name);
			}
		}

		if (collection.length) this.properties = collection;

		return this;
	}

	function initializeEntities () {
		if (!this.hasOwnProperty('entities')) return this;

		this.entities.forEach(this.bind(function (_record, _index) {
			var $node, instance, id, query, index;

			$node = this.findOwn(_record.selector);
			query = ['#'+_record.selector, '[pl-id='+_record.selector+']', '[pl-component='+_record.selector+']', '[pl-'+_record.selector+']'];
			index = 0;

			while (!$node.length) {
				if (index === query.length) {
					throw new Error("Unable to locate entity with selector", _record.selector);
				}
				$node = this.findOwn(query[index]);
				index+=1;
			}

			if (!Scope.isPrototypeOf(_record)) {
				instance = createEntity.call(this, $node, _record.implementation);

				if (!instance.isReady) {
					this.assetQueue.add(instance);
				}
				
			}

			else {
				instance = _record;
			}
			
			id = util.transformId(instance.id());
			if (id) util.assignRef(this, id, instance);
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
		var readyEvent, entities;

		readyEvent = $.Event('ready', { targetScope: this });
		entities = this.findOwn('.pl-scope').scope();

		if (entities) {
			if (entities.length > 0) {
				this.entities = entities;
			}

			else {
				this.entities = [entities];
			}
		}

		this.isReady = true;
		this.addClass('READY');

		this.__ready();
		invokeLocal.call(this, 'ready');

		this.trigger(readyEvent);
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

	this.TRANSCLUDE_REPLACE = 'replace';
	this.TRANSCLUDE_PREPEND = 'prepend';
	this.TRANSCLUDE_APPEND = 'append';
	this.TRANSCLUDE_PLUCK = 'pluck';

	this.baseType = 'TYPE_SCOPE';
	this.actionables = null;
	this.isReady = null;
	this.isComponent = false;
	this.entities = null;
	this.audio = null;
	this.properties = null;
	this.propertyHandlers = null;
	this.assetQueue = null;
	this.event = null;
	
	this.initialize = function (_node_selector, _componentName) {
		var scope;

		scope = this;

		this.isReady = false;
		this.event = null;
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

		// if (this.is('#bears')) debugger;

		this.assetQueue.on('complete', function () {
			scope.assetQueue.off();
			ready.call(scope);
		});

		this.on('ready', function (_event) {
			// console.log('* ready:', this.address(), ', target:', _event.targetScope.address());

			if (this.has(_event.targetScope) && this.assetQueue.has(_event.targetScope)) {
				// console.log('** update queue', _event.targetScope.address(), this.assetQueue.length);
				this.assetQueue.ready(_event.targetScope);
			}

			if (!this.assetQueue.length && this.isReady) this.off('ready');
		});

		return this;
	};

	this.captureReferences = function () {
		this.findOwn('[id], [pl-id]').each(this.bind(function (_index, _node) {
			var $node, id;

			if (_node.nodeName === 'AUDIO') return;

			$node = $(_node);
			id = $node.attr('id') || $node.attr('pl-id');

			if (!this[id]) {
				util.assignRef(this, id, $node.data('pl-scope') || $node);
			}
		}));
	};

	this.captureAudioAssets = function () {
		var scope, screen;

		scope = this;
		screen = typeof scope.screen === 'object' ? scope.screen : scope;

		scope.findOwn('audio').each(function () {
			var $node, id, audioTypes;

			if (!scope.hasOwnProperty('audio')) {
				scope.audio = {
					background: null,
					voiceOver: null,
					sfx: null
				};
			}

			$node = $(this);
			id = util.transformId($node.id(), true);
			audioTypes = ['background', 'voice-over', 'sfx'];

			audioTypes.forEach(function (_type) {
				if ($node.hasClass(_type)) {
					$node.on('play pause ended', function (_event) {
						var screen;

						screen = typeof scope.screen === 'object' ? scope.screen : scope;
						
						switch (_event.type) {
							case 'play':
								screen.addClass('PLAYING '+_type.toUpperCase());
								break;

							case 'pause':
							case 'ended':
								screen.removeClass('PLAYING '+_type.toUpperCase());
								break;
						}
						scope.trigger($.Event('audio-'+_event.type, {
							target: $node[0],
							targetScope: scope,
							audioType: _type
						}));
					});

					if ($node.attr('pl-required') != null) {
						screen.require($node[0]);
					}

					// This property can be either an array of nodes or the node.
					util.assignRef(scope.audio, _type, $node[0]);

					// Makes sure the property is set on the final value of scope.audio[_type].
					// This should be safe to run out of the callstack.
					setTimeout(function () {
						if (id) util.assignRef(scope.audio[util.transformId(_type, true)], id, $node[0]);
					});
				}
			});
		});

		return scope;
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
			debugger;
			prototype = (Entity.isPrototypeOf(this)) ? this : Entity;
			instance = prototype.extend(_implementation).initialize(this.find(_selector));
			id = util.transformId(instance.id());

			// this.entities.push(instance);
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

	this.has = function (_child) {
		var child;

		child = Scope.isPrototypeOf(_child) ? _child.$els : _child;

		return !!this.$els.has(child).length;
	};

	this.toString = function () {
		var type;

		type = this.baseType.replace('TYPE_', '');
		type = type.slice(0,1)+type.slice(1).toLowerCase();

		return ['[', this.id() || this.address(), ' ', type, ']'].join('');
	};

	this.log = function () {
		var args;

		args = util.toArray(arguments);

		console.log.apply(console, [this.id() || this.address(), '-'].concat(args));
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
					id = util.transformId(scope.id()) || _value;
					util.assignRef(this, id, scope);

					this.assetQueue.add(scope);
				}
				
				else {
					debugger;
				}
			}
		};

		this.action = function (_node, _name, _value) {
			if (!this.hasOwnProperty('actionables')) {
				this.actionables = Actionables.create();
				attachActionHandler.call(this);	
			}

			this.actionables.add(_node, _value);
		};

		this.required = function (_node, _name, _value) {
			if (this.is(_node)) {
				this.screen.require(this);
			}
		};

		this.require = function (_node, _name, _value) {
			var query, $node;

			if (this.is(_node)) {
				query = '#_value, [pl-id=_value], [pl-component=_value]'.replace(/_value/g, _value);
				$node = this.find(query);
				$node.on('ready', this.bind(function (_event) {
					if ($node.is(_event.target)) {
						this.log('require', _event.targetScope.id());

						this.require(_event.targetScope);
					}
				}));
			}
		};

	});

});

export default { Scope, createEntity };
