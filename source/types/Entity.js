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
				record.ability.call(this, _event);
				_event.stopPropagation();
			}
		}
	}

	function attachBehaviorEvent () {
		if (this.isMemberSafe('responsibilities')) {
			parentScope = this.parent().scope();
			if (parentScope) {
				parentScope.on('behavior', this.bind(behaviorGreeter));
			}
		}

		return this;
	}

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

	this.baseType = 'TYPE_ENTITY';
	this.STATE = {
		OPEN: 'OPEN',
		LEAVE: 'LEAVE',
		ENABLED: 'ENABLED',
		DISABLED: 'DISABLED',
		SELECTED: 'SELECTED',
		PLAYING: 'PLAYING',
		BACKGROUND: 'BACKGROUND',
		VOICE_OVER: 'VOICE-OVER'
	};

	this.timeoutID = null;
	this.intervalID = null;
	this.responsibilities = null;

	this.setup = function () {
		this.proto();
		this.captureAudioAssets();
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

			this.trigger($.Event('behavior', behaviorEvent));

			return this;
		};
	};

	this.respond = function () {
		var name, ability, parentScope;

		if (!this.hasOwnProperty('responsibilities')) {
			this.responsibilities = Collection.create();
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

	this.open = function (_target) {
		return resolveTarget.call(this, _target).removeClass(this.STATE.LEAVE).addClass(this.STATE.OPEN);
	};

	this.close = function (_target) {
		return resolveTarget.call(this, _target).removeClass(this.STATE.OPEN);
	};

	this.leave = function (_target) {
		this.close(_target);
		return resolveTarget.call(this, _target).addClass(this.STATE.LEAVE);
	};

	this.enable = function (_target) {
		return resolveTarget.call(this, _target).removeClass(this.STATE.DISABLED).addClass(this.STATE.ENABLED);
	};

	this.disable = function (_target) {
		return resolveTarget.call(this, _target).removeClass(this.STATE.ENABLED).addClass(this.STATE.DISABLED);
	};

});

export default Entity;