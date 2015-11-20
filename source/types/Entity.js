/**
*  Entity
*  @desc Contains...
*  @proto GlobalScope
*/

import util from 'util';
import GlobalScope from 'types/GlobalScope';
import Collection from 'types/Collection';
import { Point, Size } from 'types/Dimensions';
import Queue from 'types/Queue';
	
function invokeResponsibilities (_scope, _event) {
	if (_scope && _scope.isMemberSafe('responsibilities')) {
		_scope.responsibilities.forEach(function (_record) {
			if (_record.name === _event.name) {

				// console.log(_scope.id(), 'respond', _record.name, 'from', _event.targetScope.id());
				_record.ability.call(_scope, _event);
			}
		});
	}
}

var Entity = GlobalScope.extend(function () {

	function resolveTarget (_target) {
		return _target ? (_target.jquery ? _target : (_target.nodeType === document.ELEMENT_NODE ? $(_target) : this)) : this
	}

	function ResponsibilityRecord (_name, _ability) {
		this.name = _name;
		this.ability = _ability;
	}

	function behaviorGreeter (_event) {
		var i, record;
		// console.log('on behavior', this.id(), _event.name);

		for (i=0; record = this.responsibilities[i]; i+=1) {
			if (record.name === _event.name) {
				if (record.ability.call(this, _event) === false) {
					_event.stopPropagation();
				}
			}
		}
	}

	function attachBehaviorEvent () {
		var scope;

		if (this.isMemberSafe('responsibilities')) {
			scope = this.provideBehaviorEventScope();
			if (scope) {
				scope.on('behavior', this.bind(behaviorGreeter));
			}
		}

		return this;
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
		// attachBehaviorEvent.call(this);
		if (this.isMemberSafe('responsibilities')) {
			this.screen.shouldWatchBehaviors = true;
		}
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
	};

	this.require = function (_entity) {
		if (!this.hasOwnProperty('requiredQueue')) {
			this.requiredQueue = Queue.create();
			this.requiredQueue.on('complete', this.bind(function () {
				console.log('** entity complete', this.id());
				this.complete();
			}))
		}

		this.requiredQueue.add(_entity);
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
	};

	this.delay = function (_time, _cb) {
		var screen;

		screen = this;

		this.timeoutID = setTimeout(function() {
			_cb.call(screen);
		}, _time);
	};

	this.repeat = function (_time, _cb) {
		var screen;

		screen = this;

		this.intervalID = setInterval(function() {
			_cb.call(screen);
		}, _time);
	};

	this.eachFrame = function (_handler, _on) {
		var binder, frame;

		if (!this.hasOwnProperty('frameHandlers')) {
			frame = function (_time) {
				var i, handler;

				for (i=0; handler = this.frameHandlers[i]; i+=1) {
					handler.call(this, _time);
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
			var target, uiStateEvent;

			target = resolveTarget.call(this, _target);
			uiStateEvent = $.Event('ui-'+setter, {
				target: target.jquery ? target[0] : target,
				targetScope: this
			});

			// if (target.hasClass(this.STATE[STATE])) return false;

			if (_imp && _imp.shouldSet && _imp.shouldSet.apply(this, arguments) === false) {
				return !!(_imp && _imp.notSet) && _imp.notSet.apply(this, arguments);
			}

			if (_imp && _imp.willSet) _imp.willSet.apply(this, arguments);

			opperations.forEach(function (_record) {
				target[_record.method](_record.flag);
			});

			if (_imp && _imp.didSet) _imp.didSet.apply(this, arguments);

			this.trigger(uiStateEvent);

			return target;
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
	};

	this.provideBehaviorEventScope = function () {
		return this;
	};

	this.provideAblilityPototype = function () {
		var owner;

		owner = util.getOwner(this, this.baseType);

		return !!owner && owner.object;
	};

	this.behavior('complete', function () {
		if (this.hasOwnProperty('isComplete') && this.isComplete) return false;

		this.isComplete = true;
		this.addClass('COMPLETE');

		return {
			behaviorTarget: this
		};
	});

	this.behavior('grab', function (_state) {
		return {
			state: _state,
			behaviorTarget: _state.$draggable
		};
	});

	this.behavior('dragging', function (_state) {
		return {
			state: _state,
			behaviorTarget: _state.$draggable
		};
	});

	this.behavior('release', function (_state) {
		return {
			state: _state,
			behaviorTarget: _state.$draggable
		};
	});

	this.state('open opened', '+OPEN -LEAVE');
	this.state('close', '-OPEN');
	this.state('leave left', '+LEAVE', {
		willSet: function (_target) {
			this.close(_target);
		}
	});

	this.state('enable enabled', '+ENABLED -DISABLED');
	this.state('disable disabled', '+DISABLED -ENABLED');
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

	this.state('deselect', '-SELECTED');
	this.state('highlight highlighted', '+HIGHLIGHTED');
	this.state('unhighlight', '-HIGHLIGHTED');
	this.state('draggable dragEnabled', '+DRAGGABLE', {
		didSet: function (_target) {
			this.translate( resolveTarget.call(this, _target) );
		}
	});
	this.state('undraggable', '-DRAGGABLE');

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

	this.state('untranslate', '-TRANSLATED', {
		willSet: function () {
			this.css('transform', 'none');
		}
	});

});

export default { Entity, invokeResponsibilities };