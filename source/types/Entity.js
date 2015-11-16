/**
*  Entity
*  @desc Contains...
*  @proto GlobalScope
*/

import util from 'util';
import GlobalScope from 'types/GlobalScope';
import Collection from 'types/Collection';

var Entity = GlobalScope.extend(function () {

	function resolveTarget (_target) {
		return _target ? (_target.jquery ? _target : $(_target)) : this
	}

	function ResponsibilityRecord (_name, _ability) {
		this.name = _name;
		this.ability = _ability;
	}

	function behaviorGreeter (_event) {
		var i, record;

		for (i=0; record = this.responsibilities[i]; i+=1) {
			if (record.name === _event.name) {
				if (!record.ability.call(this, _event)) {
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

	this.baseType = 'TYPE_ENTITY';
	this.STATE = {
		SELECTED: 'SELECTED',
		PLAYING: 'PLAYING',
		BACKGROUND: 'BACKGROUND',
		VOICE_OVER: 'VOICE-OVER'
	};

	this.timeoutID = null;
	this.intervalID = null;
	this.responsibilities = null;
	this.isComplete = false;
	this.shouldInheritAbilities = true;

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
	});

	this.__init = function () {
		attachBehaviorEvent.call(this);

		return this;
	};

	this.behavior = function (_name, _method) {
		this[_name] = function () {
			var behaviorEvent, result;

			behaviorEvent = {
				name: _name,
				message: '',
				targetScope: this,
				behaviorTarget: this
			};

			result = _method.apply(this, arguments);

			if (result) {
				behaviorEvent = util.mixin(behaviorEvent, result);
			}

			// console.log('BEHAVIOR', _name, this.id());

			this.trigger($.Event('behavior', behaviorEvent));

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
		var flag, def, opperations;

		if (!_definition) {
			return this.proto(_flag);
		}

		def = _definition.split(/\s+/);
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
				this.STATE[util.transformId(flag)] = flag;
			}
		}));

		

		this[_flag] = function (_target) {
			var target, uiStateEvent;

			target = resolveTarget.call(this, _target);
			uiStateEvent = $.Event('ui-'+_flag, { targetScope: this });

			if (_imp && _imp.willSet) _imp.willSet.apply(this, arguments);

			opperations.forEach(function (_record) {
				target[_record.method](_record.flag);
			});

			if (_imp && _imp.didSet) _imp.didSet.apply(this, arguments);

			this.trigger(uiStateEvent);

			return target;
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
		this.isComplete = true;
		this.addClass('COMPLETE');

		return {
			behaviorTarget: this
		};
	});

	this.state('open', '+OPEN -LEAVE');
	this.state('close', '-OPEN');
	this.state('leave', '+LEAVE', {
		willSet: function (_target) {
			this.close(_target);
		}
	});
	this.state('enable', '+ENABLED -DISABLED');
	this.state('disable', '+DISABLED -ENABLED');

});

export default Entity;