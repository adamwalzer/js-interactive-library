/**
*  Entity
*  @desc Contains...
*  @proto GlobalScope
*/

import util from 'util';
import GlobalScope from 'types/GlobalScope';

var Entity = GlobalScope.extend(function () {

	function resolveTarget (_target) {
		return _target ? (_target.jquery ? _target : $(_target)) : this
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

	this.setup = function () {
		this.proto();
		this.captureAudioAssets();

		return this;
	};

	this.behavior = function (_name, _method) {
		this[_name] = function () {
			var behaviorEvent, result;

			behaviorEvent = {
				name: _name,
				targetScope: this
			};

			result = _method.apply(this, arguments);

			if (result) {
				behaviorEvent = util.mixin(behaviorEvent, result);
			}

			this.trigger($.Event('behavior', behaviorEvent));

			return this;
		};
	};

	this.ability = function () {
		// body...
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

	this.state = function (_test) {
		var classes;

		if (_test) return this.hasClass(_test);

		classes = this.attr('class').match(/[0-9A-Z]+(?:-[0-9A-Z]+)?/g);

		return classes && (classes.length === 1 ? classes[0] : classes);
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