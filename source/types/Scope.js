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
import { AudioManager } from 'types/AudioManager';

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
			// If a scope is being defined as an extention of a component before the component scope
			// has been allocated, we construct the component first then pass it as the proto.
			// But we need to make sure we are not allocating the component it self.
			if (componentRecord.implementation !== _implementation) {
				prototype = this.extend(componentRecord.implementation);
			}
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
		this.on(pl.EVENT.ACTION, function (_event) {
			var target, record;

			target = $(_event.target).closest('[pl-action]')[0];

			if (_event.originalEvent && _event.originalEvent.changedTouches) {
				/**
				 * For now, interactions should use the last touch if multiple fingers are captured.
				 * @todo Maybe invoke action for each touch.
				 */
				_event.touch = _event.originalEvent.changedTouches[_event.originalEvent.changedTouches.length-1];
			}
			
			_event.cursor = Point.create().set(new function () {
				if (_event.touch) {
					this.x = _event.touch.clientX;
					this.y = _event.touch.clientY;
				} else {
					this.x = _event.clientX;
					this.y = _event.clientY;
				}
			});

			if (target) {
				record = this.actionables.item(target);

				if (record) {
					_event.targetScope = this;
					this.event = _event;
					evalAction(record.action, this);
					this.event = null;
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

				scope.findOwn('[pl-component]').each(function () {
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

		if (!$('style[pl-for-component="'+_name+'"]').length && game.config('shouldLoadComponentStyles') !== false) {
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
				collection[util.transformId(name, true)] = attr.value;
				
				collection.push(name);
			}
		}

		if (collection.length) this.properties = collection;

		return this;
	}

	function initializeEntities () {
		if (!this.hasOwnProperty('entities')) return this;

		this.entities.forEach(this.bind(function (_record, _index) {
			var $nodes, query, index;

			$nodes = this.findOwn(_record.selector);
			query = ['#'+_record.selector, '[pl-id='+_record.selector+']', '[pl-component='+_record.selector+']', '[pl-'+_record.selector+']'];
			index = 0;

			while (!$nodes.length) {
				if (index === query.length) {
					throw new Error("Unable to locate entity with selector", _record.selector);
				}
				$nodes = this.findOwn(query[index]);
				index+=1;
			}

			$nodes.each(this.bind(function (_index, _node) {
				var $node, instance, id;

				$node = $(_node);

				if (!Scope.isPrototypeOf(_record)) {
					instance = createEntity.call(this, $node, _record.implementation);
					if (!instance.isReady) this.assetQueue.add(instance);
				} else {
					instance = _record;
				}
				
				id = util.transformId(instance.id(), true);
				if (id) util.assignRef(this, id, instance);
			}));
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
				// Only exclide members on the base type.
				if (Basic.hasOwnProperty(property)) continue;

				handler = this.propertyHandlers[property];

				this.findOwn('[pl-'+property+']').each(function () {
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
		var willInitEvent, initEvent;

		initEvent = $.Event('initialize', { targetScope: this });
		willInitEvent = $.Event('will-initialize', { targetScope: this });

		invokeLocal.call(this, 'willInit');
		this.trigger(willInitEvent);

		this.attachEvents();

		initializeEntities.call(this);
		handleProperties.call(this);

		this.watchAssets();
		this.captureAudioAssets();
		this.captureReferences();

		this.__init();
		invokeLocal.call(this, 'init');

		this.trigger(initEvent);

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
			} else {
				this.entities = [entities];
			}
		}

		/**
		 * Sort audio into DOM order.
		 * @todo Consider including this into `AudioManager`. Micah: 2/23/2016.
		 */
		if (this.hasOwnProperty('audio')) {
			(this.game || this).media.addShadow(this.audio);
			this.audio.collections().forEach(function (_collection) {
				var map = {
					voiceOver: 'voice-over',
					background: 'background',
					sfx: 'sfx'
				};

				if (!_collection.length) return;

				this.findOwn('audio.'+map[_collection.type]).each(function (_index, _node) {
					var id, audio, collection, index;

					id = $(_node).id();
					audio = (_collection.find('#'+id) || [])[0];
					index = _collection.indexOf(audio);

					if (index !== _index) {
						_collection[index] = _collection[_index];
						_collection[_index] = audio;
					}
				});
			}.bind(this));
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
		this.isComponent = !!_componentName;
		this.event = null;
		this.assetQueue = Queue.create();
		this.$els = (_node_selector.jquery) ? _node_selector : $(_node_selector);

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

	this.watchAssets = function (_nodes) {
		var assetTypes, watch, createHandler;

		createHandler = this.bind(function (_node) {
			return (function () {
				var loadedEvent = $.Event('loaded', { targetScope: this });

				this.assetQueue.ready(_node.src);
				this.trigger(loadedEvent, [_node]);
			}).bind(this);
		});

		watch = this.bind(function (_node) {
			var eventMap, isNodeComplete;

			eventMap = {
				VIDEO: 'onloadeddata',
				IMG: 'onload'
			};

			isNodeComplete = (function () {
				switch (_node.nodeName) {
					case 'IMG':
						return !!_node.complete;
					case 'VIDEO':
						if (_node.readyState === _node.HAVE_ENOUGH_DATA) return true;
						_node.load();
						break;
				}

				return false;
			}).call(this);

			if (isNodeComplete) return;
			if (this.assetQueue.add(_node.src)) {
				_node[eventMap[_node.nodeName]] = createHandler(_node);
				_node.onerror = function () {
					console.error('Image failed to load', _node.src);
				};
			}
		});

		assetTypes = ['IMG', 'VIDEO'];

		if (_nodes) {
			_nodes.forEach(watch);
			return this;
		}

		this.each(function () {
			if (~assetTypes.indexOf(this.nodeName)) {
				watch(this);
			}
		});

		this.findOwn(assetTypes.join(',')).each(function () {
			watch(this);
		});

		return this;
	};

	this.attachEvents = function () {

		this.proto();

		this.assetQueue.on('complete', this.bind(function () {
			this.assetQueue.off();
			ready.call(this);
		}));

		this.on('ready', function (_event) {
			if (this.has(_event.targetScope) && this.assetQueue.has(_event.targetScope)) {
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
		var deQ, $audio;

		if (!($audio = this.findOwn('audio')).length) return false;

		deQ = function (_item) {
			[this, this.screen].forEach(function (_scope) {
				if (_scope.requiredQueue && _scope.isMemberSafe('requiredQueue') && _scope.requiredQueue.has(_item)) {
					_scope.requiredQueue.ready(_item);
				}
			});
		}.bind(this);
		
		this.audio = AudioManager.create(this.id());

		$audio.each(function (_index, _node) {
			this.assetQueue.add(_node.src);
			this.audio.watch(_node).then(function (_audio) {
				var loadedEvent = $.Event('loaded', { target: _node, targetScope: this });

				if ($(_node).is('[pl-required]')) this.screen.require(_audio);

				if (this.assetQueue.has(_node.src)) this.assetQueue.ready(_node.src);

				this.trigger(loadedEvent);
			}.bind(this));
		}.bind(this));

		// proxy events
		this.audio.on('play pause ended', this.bind(function (_event) {
			var map = {
				background: 'BACKGROUND',
				voiceOver: 'VOICE-OVER',
				sfx: 'SFX'
			};

			switch (_event.type) {
				case 'play':
					[this, this.screen].forEach(function (_scope) {
						if (_scope.$els) _scope.addClass('PLAYING '+map[_event.target.type]);
					});
					$(_event.targetNode).addClass('PLAYING');
					break;

				case 'pause':
				case 'ended':
					[this, this.screen].forEach(function (_scope) {
						if (_scope.$els) {
							_scope.removeClass(map[_event.target.type]);
							if (!(/BACKGROUND|VOICE-OVER|SFX/).test(_scope.state().join(' '))) _scope.removeClass('PLAYING');
						}

					});
					$(_event.targetNode).removeClass('PLAYING');
					deQ(_event.target);
					break;
			}

			// this.log(_event.type+' : '+_event.target.fileName+'#'+_event.target.id, this.audio);

			var audioEvent = $.Event('audio-'+_event.type, {
				target: _event.target,
				targetSource: _event.targetSource,
				targetNode: _event.targetNode,
				targetScope: this
			});

			this.trigger(audioEvent);
		}));

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
			throw new Error('Wait this hasn\'t been tested.');
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
			var $node, record, scope, id;

			$node = $(_node);
			
			if (!$node.data('pl-isComponent')) {
				record = game.component.get(_value);

				if (record) {
					scope = createEntity.call(this, $node, record.implementation);
					id = util.transformId(scope.id() || _value, true);
					util.assignRef(this, id, scope);

					if (!scope.isReady) this.assetQueue.add(scope);
				}
				
				else {
					throw new Error('Ahh!');
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

			// if the node with the attribute is the node for this scope
			if (this.is(_node)) {
				query = '#_value, [pl-id=_value], [pl-component=_value]'.replace(/_value/g, _value);
				$node = this.find(query);

				if ($node.is('audio, video')) {
					$node.each(this.bind(function (_index, _node) {
						this.require(_node);
					}));
				}
				
				else {
					$node.on('ready', this.bind(function (_event) {
						if ($node.is(_event.target)) {
							this.require(_event.targetScope);
						}
					}));
				}
			}
		};

	});

});

export default { Scope, createEntity };
