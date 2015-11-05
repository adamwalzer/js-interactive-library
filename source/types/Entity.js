/**
*  Entity
*  @desc Contains...
*  @proto GlobalScope
*/

import GlobalScope from 'types/GlobalScope';

var Entity = GlobalScope.extend(function () {

	function resolveTarget (_target) {
		return _target ? (_target.jquery ? _target : $(_target)) : this
	}

	this.baseType = 'TYPE_ENTITY';
	this.STATE = {
		OPEN: 'OPEN',
		LEAVE: 'LEAVE',
		ENABLED: 'ENABLED',
		DISABLED: 'DISABLED',
	};

	this.timeoutID = null;
	this.intervalID = null;

	this.index = function () {
		return this.game.screens.indexOf(this);
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

		classes = this.attr('class').match(/[0-9A-Z]+(?:-[0-9A-Z]+)?/);

		return classes && (classes.length === 1 ? classes[0] : classes);
	};

	this.open = function (_target) {
		return resolveTarget.call(this, _target).addClass(this.STATE.OPEN);
	};

	this.close = function (_target) {
		return resolveTarget.call(this, _target).removeClass(this.STATE.OPEN);
	};

	this.leave = function (_target) {
		this.close();
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