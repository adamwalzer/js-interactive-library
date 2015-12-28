/**
 * Base class for a scope acting as an "entity" with "states", "behaviors" and the ability to respond (responsibilities) to behaviors.
 *
 * @module
 */
import util from 'util';
import GlobalScope from 'types/GlobalScope';
import Collection from 'types/Collection';
import { Point, Size } from 'types/Dimensions';
import Queue from 'types/Queue';
	
function invokeResponsibilities (_scope, _event) {
	if (_scope && _scope.responsibilities && _scope.isMemberSafe('responsibilities')) {
		_scope.responsibilities.forEach(function (_record) {
			if (_record.name === _event.name) {

				// console.log(_scope.id(), 'respond', _record.name, 'from', _event.targetScope.id());
				_record.ability.call(_scope, _event);
			}
		});
	}
}

/**
 * <span class="note important">NOTE: This is NOT a constructor. Use `Entity.create()` to get a new instance.</span>
 * @classdesc Base class for a scope acting as an "entity" with "states", "behaviors" and the ability to respond (responsibilities) to behaviors. For more information on these terms read [this]{@link module:types/Entity}.
 * <style>
 * .tag {
 *   padding: 1px 4px;
 *   border-radius: 4px;
 *
 *   color: #fff;
 *   background-color: #aaa;
 * }
 *
 * .tag.behavior {
 *	 background-color: #0ba;
 * }
 *
 * .tag.state {
 *	 background-color: #ba0;
 * }
 *
 * .note {
 *   border: solid 1px;
 *   border-radius: 4px;
 *   padding: 1px 4px;
 *   color: #aaa;
 *   background-color: #eee;
 * }
 * 
 * .note.important {
 *   color: #b55;
 *   background-color: #fee;
 * }
 * </style>
 *
 * @class
 * @prop {module:types/Collection~Collection} responsibilities - A collection of ResponsibilityRecords for the scope.
 * @prop {boolean} isComplete - Marks a scope as "complete" via the [`complete()`]{@link module:types/Entity~Entity#complete} behavior.
 * @extends GlobalScope
 */
var Entity = GlobalScope.extend(function () {

	function resolveTarget (_target) {
		
		switch (typeof _target) {
			case 'string': return this.findOwn(_target);
			case 'object':
				if (_target.jquery) return _target;
				if (Entity.isPrototypeOf(_target)) return _target;
				if (_target.nodeType === document.ELEMENT_NODE) return $(_target);
		}

		return this;
	}

	function ResponsibilityRecord (_name, _ability) {
		this.name = _name;
		this.ability = _ability;
	}

	function dragGreeter (_event) {
		switch (_event.type) {
			case 'drag-start':
				this.grab(_event.state);
				break;

			case 'drag-move':
				this.dragging(_event.state);
				break;

			case 'drag-end':
				this.release(_event.state);
				break;
		}
	}

	function attachDragEvents () {
		if (this.draggables && this.isMemberSafe('draggables') && this.draggables.length) {
			this.on('drag-start drag-move drag-end', dragGreeter);
		}
	}

	this.baseType = 'TYPE_ENTITY';
	this.STATE = {
		PLAYING: 'PLAYING',
		BACKGROUND: 'BACKGROUND',
		VOICE_OVER: 'VOICE-OVER'
	};

	this.timeoutID = null;
	this.intervalID = null;
	this.responsibilities = null;
	this.isComplete = false;
	this.shouldInheritAbilities = true;
	this.frameHandlers = null;
	this.frameRate = 60; // 60fps
	this.draggables = null;
	this.requiredQueue = null;

	this.handleProperty(function () {
		this.size = function (_node, _name, _value, _property) {
			var size;

			if (this.is(_node)) {
				size = _value.split(/\s*[x,]\s*/);
				this.css({
					width: size[0],
					height: size[1] || size[0]
				});
			}
		};

		this.position = function (_node, _name, _value, _property) {
			var size;

			if (this.is(_node)) {
				size = _value.split(/\s*[x,]\s*/);
				this.css({
					top: size[1] || size[0],
					left: size[0]
				});
			}
		};

		this.draggable = function (_node, _name, _value, _property) {
			if (!this.hasOwnProperty('draggables')) {
				this.draggables = $();
			}

			this.draggables.push(_node);
		};
	});

	this.__init = function () {
		this.proto()
		attachDragEvents.call(this);
		return this;
	};

	this.size = function () {
		var size;

		if (arguments.length) {
			size = Size.create(arguments);
			this.css(size);
			return size;
		}

		return Size.create().set(this.width(), this.height());
	};

	this.propagateBehavior = function (_event) {
		var ids;

		ids = [];

		this.findOwn('.pl-scope').each(function (_index, _node) {
			var $node = $(_node); 
			ids.push($node.id() || $node.address());
		});

		if (this.hasOwnProperty('entities') && this.entities.length) {
			// console.log(this.id(), 'propagate', _event.name, 'to', this.entities.length, 'nodes', ids);

			this.entities.forEach(function (_scope) {
				invokeResponsibilities(_scope, _event);
				_scope.propagateBehavior(_event);
			});
		}

		return this;
	};

	this.require = function (_entity) {
		if (!this.hasOwnProperty('requiredQueue')) {
			this.requiredQueue = Queue.create();
			this.requiredQueue.on('complete', this.bind(function () {
				this.log('entity complete');
				this.complete();
			}));

			this.respond('complete', function (_event) {
				if (!this.has(_event.target)) return;
				if (_event.targetScope === this) return;

				this.requiredQueue.ready(_event.behaviorTarget);
			});
		}

		this.requiredQueue.add(_entity);
		this.gate();

		return this;
	};

	this.behavior = function (_name, _behavior) {
		_behavior.method = this[_name] = function () {
			var behaviorEvent, result;

			behaviorEvent = {
				name: _name,
				message: '',
				targetScope: this,
				behaviorTarget: this
			};

			result = _behavior.apply(this, arguments);

			if (typeof result === 'object') {
				behaviorEvent = util.mixin(behaviorEvent, result);
			}

			if (result !== false) {
				this.trigger($.Event('behavior', behaviorEvent));	
			}

			return this;
		};

		return this;
	};

	this.respond = function () {
		var name, ability, parentScope, abilities, protoAbilities;

		if (!this.hasOwnProperty('responsibilities')) {
			abilities = Collection.create();
			protoAbilities = this.provideAblilityPototype();

			if (this.shouldInheritAbilities && (protoAbilities && protoAbilities.responsibilities)) {
				abilities.push.apply(abilities, protoAbilities.responsibilities);
			}

			this.responsibilities = abilities;
		}

		if (arguments.length === 1) {
			switch (typeof arguments[0]) {
				case 'string': name = arguments[0]; break;

				case 'function':
				case 'object': ability = arguments[0]; break;
			}
		}

		else {
			name = arguments[0];
			ability = arguments[1];
		}

		switch (typeof ability) {
			case 'object':
				for (name in ability) {
					if (!ability.hasOwnProperty(name)) continue;

					this.respond(name, ability[name]);
				}
				break;

			case 'function':
				this.responsibilities.add(new ResponsibilityRecord(name, ability));
				break;
		}

		return this;
	};

	this.delay = function (_time, _cb) {
		var screen, time;

		screen = this;
		time = util.toMillisec(_time);

		this.timeoutID = setTimeout(function() {
			_cb.call(screen);
		}, time);

		return this;
	};

	this.repeat = function (_time, _cb) {
		var screen, time;

		screen = this;
		time = util.toMillisec(_time);

		this.intervalID = setInterval(function() {
			_cb.call(screen);
		}, time);

		return this;
	};

	this.eachFrame = function (_handler, _on) {
		var binder, frame, lastTime, rate, frames;

		rate = this.frameRate || 1000;
		frames = 0;
		lastTime = 0;

		if (!this.hasOwnProperty('frameHandlers')) {
			frame = function (_time) {
				var i, handler;

				if (rate) {
					if (_time - lastTime >= (1000/rate)) {
						for (i=0; handler = this.frameHandlers[i]; i+=1) {
							handler.call(this, _time, Math.round(1000/(_time - lastTime)), rate);
						}

						if (frames === rate) frames = 0;

						frames+=1;
						lastTime = _time;
					}
				}

				if (this.frameHandlers.length) {
					window.requestAnimationFrame(binder);
				}
			};

			binder = this.bind(frame);

			// allows methods passed as _handler's to
			// be able to trace back for proto() callbacks.
			frame.method = this.eachFrame;

			this.frameHandlers = Collection.create();
			window.requestAnimationFrame(binder);
		}

		if (_on !== false) {
			this.frameHandlers.add(_handler);
		}

		else {
			this.frameHandlers.remove(_handler);
		}

		return this;
	};

	this.kill = function (_timer) {
		if (_timer === 'repeat') {
			clearInterval(this.intervalID);
		}

		else {
			clearTimeout(this.timeoutID);
		}

		return this;
	};

	this.state = function (_flag, _definition, _imp) {
		var flag, tester, setter, getter, STATE, def, opperations, names;

		if (!_definition) {
			return this.proto(_flag);
		}

		def = _definition.split(/\s+/);
		names = _flag.split(/\s+/);
		opperations = [];

		def.forEach(this.bind(function (_opp) {
			var method, flag;

			method = (_opp.slice(0, 1) === '+') ? 'addClass' : 'removeClass';

			opperations.push({
				method: method,
				flag: _opp.slice(1)
			});

			if (method === 'addClass') {
				flag = _opp.slice(1);
				STATE = util.transformId(flag);
				this.STATE[STATE] = flag;
			}
		}));

		setter = names[0];
		tester = names[1];

		this[setter] = function (_target) {
			var target, uiStateEvent, oppsPerformed;

			target = resolveTarget.call(this, _target);
			uiStateEvent = $.Event('ui-'+setter, {
				target: target.jquery ? target[0] : target,
				targetScope: this
			});
			oppsPerformed = 0;

			if (_imp && _imp.shouldSet && _imp.shouldSet.apply(this, arguments) === false) {
				return !!(_imp && _imp.notSet) && _imp.notSet.apply(this, arguments);
			}

			if (_imp && _imp.willSet) _imp.willSet.apply(this, arguments);

			opperations.forEach(function (_record) {
				// If we are adding or removing a class, test if the target already has/removed it.
				// If so, then bump "oppsPerformed".
				oppsPerformed += Number(target.hasClass(_record.flag) === !~_record.method.indexOf('add'));
				target[_record.method](_record.flag);
			});

			if (_imp && _imp.didSet) _imp.didSet.apply(this, arguments);


			if (oppsPerformed) {
				this.trigger(uiStateEvent);
				return target;
			}
			
			return false;
		};

		if (tester) {
			getter = 'get' + tester.slice(0, 1).toUpperCase() + tester.slice(1);

			this[tester] = function (_target) {
				var target;

				target = resolveTarget.call(this, _target);

				return target.hasClass(this.STATE[STATE]);
			};

			this[getter] = function () {
				return this.findOwn('.'+this.STATE[STATE]);
			};
		}

		return this;
	};

	this.provideBehaviorEventScope = function () {
		return this;
	};

	this.provideAblilityPototype = function () {
		var owner;

		owner = util.getOwner(this, this.baseType);

		return !!owner && owner.object;
	};

	this.completed = function () {
		return this.game.demoMode || (this.hasOwnProperty('isComplete') && this.isComplete) || !this.requiredQueue || this.requiredQueue.length === 0;
	};

	/**
	 * <span class="tag behavior">Behavior</span>
	 * Marks a scope "complete" by seting `isComplete` to `true` and add the `COMPLETE` state flag.
	 * @function module:types/Entity~Entity#complete
	 * @returns {object} A messages object with `behaviorTarget` set to the scope performing the behavior.
	 */
	this.behavior('complete', function () {
		if (this.hasOwnProperty('isComplete') && this.isComplete) return false;

		this.isComplete = true;
		this.addClass('COMPLETE');

		return {
			behaviorTarget: this
		};
	});

	/**
	 * <span class="tag behavior">Behavior</span>
	 * Reports a drggable has been grabbed for dragging.
	 * @function module:types/Entity~Entity#grab
	 * @arg {object} _state - An object containing the state of a draggable.
	 * @returns {object} A messages object with `behaviorTarget` set to the scope performing the behavior.
	 *
	 * @see module:play~pl.game.manager.draggable for more info on draggable state.
	 */
	this.behavior('grab', function (_state) {
		return {
			state: _state,
			behaviorTarget: _state.$draggable
		};
	});

	/**
	 * <span class="tag behavior">Behavior</span>
	 * Reports a draggable as being dragged.
	 * @function module:types/Entity~Entity#dragging
	 * @arg {object} _state - An object containing the state of a draggable.
	 * @returns {object} A messages object with `behaviorTarget` set to the scope performing the behavior.
	 *
	 * @see module:play~pl.game.manager.draggable for more info on draggable state.
	 */
	this.behavior('dragging', function (_state) {
		return {
			state: _state,
			behaviorTarget: _state.$draggable
		};
	});

	/**
	 * <span class="tag behavior">Behavior</span>
	 * Reports a drggable as released or droped.
	 * @function module:types/Entity~Entity#release
	 * @arg {object} _state - An object containing the state of a draggable.
	 * @returns {object} A messages object with `behaviorTarget` set to the scope performing the behavior.
	 *
	 * @see module:play~pl.game.manager.draggable for more info on draggable state.
	 */
	this.behavior('release', function (_state) {
		return {
			state: _state,
			behaviorTarget: _state.$draggable
		};
	});

	/**
	 * <span class="tag state">State</span>
	 * Adds `OPEN` and removes the `LEAVE` CSS class names from the scope or the given `_target`.
	 * @function module:types/Entity~Entity#open
	 * @fires Entity#ui-open
	 * @arg {string|Scope|jQuery|HTMLElement} _target - A CSS selector, DOM node reference or context object (i.e. Scope/jQuery).
	 * @returns `this`
	 */

	/**
	 * <span class="tag state">State</span>
	 * Tests if the scope or given `_target` has the `OPEN` class name.
	 * @function module:types/Entity~Entity#opened
	 * @arg {string|Scope|jQuery|HTMLElement} _target - A CSS selector, DOM node reference or context object (i.e. Scope/jQuery).
	 * @returns {Boolean} Open'ness.
	 */

	/**
	 * <span class="tag state">State</span>
	 * Provides the elements with the `OPEN` class name.
	 * @function module:types/Entity~Entity#getOpened
	 * @returns {jQuery} jQuery collection of matched nodes.
	 * @todo Return scope if available.
	 */
	this.state('open opened', '+OPEN -LEAVE');

	/**
	 * <span class="tag state">State</span>
	 * Removes the `OPEN` CSS class name from the scope or the given `_target`.
	 * @function module:types/Entity~Entity#close
	 * @fires Entity#ui-close
	 * @arg {string|Scope|jQuery|HTMLElement} _target - A CSS selector, DOM node reference or context object (i.e. Scope/jQuery).
	 * @returns `this`
	 */
	this.state('close', '-OPEN');

	/**
	 * <span class="tag state">State</span>
	 * Adds the `LEAVE` CSS class name to the scope or the given `_target`.
	 * @function module:types/Entity~Entity#leave
	 * @fires Entity#ui-leave
	 * @arg {string|Scope|jQuery|HTMLElement} _target - A CSS selector, DOM node reference or context object (i.e. Scope/jQuery).
	 * @returns `this`
	 */

	/**
	 * <span class="tag state">State</span>
	 * Tests if the scope or given `_target` has the `LEAVE` class name.
	 * @function module:types/Entity~Entity#left
	 * @arg {string|Scope|jQuery|HTMLElement} _target - A CSS selector, DOM node reference or context object (i.e. Scope/jQuery).
	 * @returns {Boolean} Leave'ness.
	 */

	/**
	 * <span class="tag state">State</span>
	 * Provides the elements with the `LEAVE` class name.
	 * @function module:types/Entity~Entity#getLeft
	 * @returns {jQuery} jQuery collection of matched nodes.
	 * @todo Return scope if available.
	 */
	this.state('leave left', '+LEAVE', {
		willSet: function (_target) {
			this.close(_target);
		}
	});

	/**
	 * <span class="tag state">State</span>
	 * Adds `ENABLED` and removes the `DISABLED` CSS class names from the scope or the given `_target`.
	 * @function module:types/Entity~Entity#enable
	 * @fires Entity#ui-enable
	 * @arg {string|Scope|jQuery|HTMLElement} _target - A CSS selector, DOM node reference or context object (i.e. Scope/jQuery).
	 * @returns `this`
	 */

	/**
	 * <span class="tag state">State</span>
	 * Tests if the scope or given `_target` has the `ENABLED` class name.
	 * @function module:types/Entity~Entity#enabled
	 * @arg {string|Scope|jQuery|HTMLElement} _target - A CSS selector, DOM node reference or context object (i.e. Scope/jQuery).
	 * @returns {Boolean} Enabled'ness.
	 */

	/**
	 * <span class="tag state">State</span>
	 * Provides the elements with the `ENABLED` class name.
	 * @function module:types/Entity~Entity#getEnabled
	 * @returns {jQuery} jQuery collection of matched nodes.
	 * @todo Return scope if available.
	 */
	this.state('enable enabled', '+ENABLED -DISABLED');

	/**
	 * <span class="tag state">State</span>
	 * Adds `DISABLED` and removes the `ENABLED` CSS class names from the scope or the given `_target`.
	 * @function module:types/Entity~Entity#disable
	 * @fires Entity#ui-disable
	 * @arg {string|Scope|jQuery|HTMLElement} _target - A CSS selector, DOM node reference or context object (i.e. Scope/jQuery).
	 * @returns `this`
	 */

	/**
	 * <span class="tag state">State</span>
	 * Tests if the scope or given `_target` has the `DISABLED` class name.
	 * @function module:types/Entity~Entity#disabled
	 * @arg {string|Scope|jQuery|HTMLElement} _target - A CSS selector, DOM node reference or context object (i.e. Scope/jQuery).
	 * @returns {Boolean} Disabled'ness.
	 */

	/**
	 * <span class="tag state">State</span>
	 * Provides the elements with the `DISABLED` class name.
	 * @function module:types/Entity~Entity#getDisabled
	 * @returns {jQuery} jQuery collection of matched nodes.
	 * @todo Return scope if available.
	 */
	this.state('disable disabled', '+DISABLED -ENABLED');

	/**
	 * <span class="tag state">State</span>
	 * Adds the `SELECTED` CSS class name to the scope or the given `_target`.
	 * @function module:types/Entity~Entity#select
	 * @fires Entity#ui-select
	 * @arg {string|Scope|jQuery|HTMLElement} _target - A CSS selector, DOM node reference or context object (i.e. Scope/jQuery).
	 * @returns `this`
	 */

	/**
	 * <span class="tag state">State</span>
	 * Tests if the scope or given `_target` has the `SELECTED` class name.
	 * @function module:types/Entity~Entity#selected
	 * @arg {string|Scope|jQuery|HTMLElement} _target - A CSS selector, DOM node reference or context object (i.e. Scope/jQuery).
	 * @returns {Boolean} Selected'ness.
	 */

	/**
	 * <span class="tag state">State</span>
	 * Provides the elements with the `SELECTED` class name.
	 * @function module:types/Entity~Entity#getDisabled
	 * @returns {jQuery} jQuery collection of matched nodes.
	 * @todo Return scope if available.
	 */
	this.state('select selected', '+SELECTED', {
		willSet: function (_target) {
			var target, $parent;
			
			target = resolveTarget.call(this, _target);
			$parent = target.parent();

			$parent.find('> .SELECTED').each(this.bind(function (_index, _node) {
				this.deselect(_node);
			}));
			$parent.find('> .HIGHLIGHTED').each(this.bind(function (_index, _node) {
				this.unhighlight(_node);
			}));
		}
	});

	/**
	 * <span class="tag state">State</span>
	 * Removes the `SELECTED` CSS class name from the scope or the given `_target`.
	 * @function module:types/Entity~Entity#deselect
	 * @fires Entity#ui-deselect
	 * @arg {string|Scope|jQuery|HTMLElement} _target - A CSS selector, DOM node reference or context object (i.e. Scope/jQuery).
	 * @returns `this`
	 */
	this.state('deselect', '-SELECTED');

	/**
	 * <span class="tag state">State</span>
	 * Adds the `HIGHLIGHTED` CSS class name to the scope or the given `_target`.
	 * @function module:types/Entity~Entity#highlight
	 * @fires Entity#ui-highlight
	 * @arg {string|Scope|jQuery|HTMLElement} _target - A CSS selector, DOM node reference or context object (i.e. Scope/jQuery).
	 * @returns `this`
	 */

	/**
	 * <span class="tag state">State</span>
	 * Tests if the scope or given `_target` has the `HIGHLIGHTED` class name.
	 * @function module:types/Entity~Entity#highlighted
	 * @arg {string|Scope|jQuery|HTMLElement} _target - A CSS selector, DOM node reference or context object (i.e. Scope/jQuery).
	 * @returns {Boolean} Highlighted'ness.
	 */

	/**
	 * <span class="tag state">State</span>
	 * Provides the elements with the `HIGHLIGHTED` class name.
	 * @function module:types/Entity~Entity#getHighlighted
	 * @returns {jQuery} jQuery collection of matched nodes.
	 * @todo Return scope if available.
	 */
	this.state('highlight highlighted', '+HIGHLIGHTED');

	/**
	 * <span class="tag state">State</span>
	 * Removes the `HIGHLIGHTED` CSS class name from the scope or the given `_target`.
	 * @function module:types/Entity~Entity#unhighlight
	 * @fires Entity#ui-unhighlight
	 * @arg {string|Scope|jQuery|HTMLElement} _target - A CSS selector, DOM node reference or context object (i.e. Scope/jQuery).
	 * @returns `this`
	 */
	this.state('unhighlight', '-HIGHLIGHTED');

	/**
	 * <span class="tag state">State</span>
	 * Adds the `DRAGGABLE` CSS class name to the scope or the given `_target`.
	 * @function module:types/Entity~Entity#draggable
	 * @fires Entity#ui-draggable
	 * @arg {string|Scope|jQuery|HTMLElement} _target - A CSS selector, DOM node reference or context object (i.e. Scope/jQuery).
	 * @returns `this`
	 */

	/**
	 * <span class="tag state">State</span>
	 * Tests if the scope or given `_target` has the `DRAGGABLE` class name.
	 * @function module:types/Entity~Entity#dragEnabled
	 * @arg {string|Scope|jQuery|HTMLElement} _target - A CSS selector, DOM node reference or context object (i.e. Scope/jQuery).
	 * @returns {Boolean} Draggable'ness.
	 */

	/**
	 * <span class="tag state">State</span>
	 * Provides the elements with the `DRAGGABLE` class name.
	 * @function module:types/Entity~Entity#getDragEnabled
	 * @returns {jQuery} jQuery collection of matched nodes.
	 * @todo Return scope if available.
	 */
	this.state('draggable dragEnabled', '+DRAGGABLE', {
		didSet: function (_target) {
			this.translate( resolveTarget.call(this, _target) );
		}
	});

	/**
	 * <span class="tag state">State</span>
	 * Removes the `DRAGGABLE` CSS class name from the scope or the given `_target`.
	 * @function module:types/Entity~Entity#undraggable
	 * @fires Entity#ui-undraggable
	 * @arg {string|Scope|jQuery|HTMLElement} _target - A CSS selector, DOM node reference or context object (i.e. Scope/jQuery).
	 * @returns `this`
	 */
	this.state('undraggable', '-DRAGGABLE');

	/**
	 * <span class="tag state">State</span>
	 * Adds the `TRANSLATED` CSS class name to the scope or the given `_target`. The target also gets a 2d transform at the given `_point`.
	 * @function module:types/Entity~Entity#translate
	 * @fires Entity#ui-translate
	 * @arg {string|Scope|jQuery|HTMLElement} _target - A CSS selector, DOM node reference or context object (i.e. Scope/jQuery).
	 * @arg {module:types/Dimensions~Point} _point - Point object with coordinates {x,y}.
	 * @returns `this`
	 */

	/**
	 * <span class="tag state">State</span>
	 * Adds the `TRANSLATED` CSS class name to the scope. The scope also gets a 2d transform at the given `_point`.
	 * @function module:types/Entity~Entity#translate
	 * @fires Entity#ui-translate
	 * @arg {module:types/Dimensions~Point} _point - Point object with coordinates {x,y}.
	 * @returns `this`
	 */

	/**
	 * <span class="tag state">State</span>
	 * Tests if the scope or given `_target` has the `TRANSLATED` class name.
	 * @function module:types/Entity~Entity#translated
	 * @arg {string|Scope|jQuery|HTMLElement} _target - A CSS selector, DOM node reference or context object (i.e. Scope/jQuery).
	 * @returns {Boolean} Translate'ness.
	 */

	/**
	 * <span class="tag state">State</span>
	 * Provides the elements with the `TRANSLATED` class name.
	 * @function module:types/Entity~Entity#getTranslated
	 * @returns {jQuery} jQuery collection of matched nodes.
	 * @todo Return scope if available.
	 */
	this.state('translate translated', '+TRANSLATED', {
		willSet: function (_target_point, _point) {
			var point, target;
			
			target = resolveTarget.call(this, _target_point);
			point = (!~[_target_point.x, _target_point.y].indexOf(undefined)) ? _target_point : _point;

			if (point) {
				target.css('transform', 'translateX('+point.x+'px) translateY('+point.y+'px)');
			}
		}
	});

	/**
	 * <span class="tag state">State</span>
	 * Removes the `TRANSLATED` CSS class name and CSS transform from the scope or the given `_target`.
	 * @function module:types/Entity~Entity#untranslate
	 * @fires Entity#ui-untranslate
	 * @arg {string|Scope|jQuery|HTMLElement} _target - A CSS selector, DOM node reference or context object (i.e. Scope/jQuery).
	 * @returns `this`
	 */
	this.state('untranslate', '-TRANSLATED', {
		willSet: function () {
			this.css('transform', 'none');
		}
	});

	this.state('gate gated', '+GATED');

});

export default { Entity, invokeResponsibilities };
