/**
*  Entity
*  @desc Contains...
*  @proto GlobalScope
*/

import GlobalScope from 'types/GlobalScope';
import Basic from 'types/Basic';
import util from 'util';
import evalAction from 'evalAction';

export default GlobalScope.extend(function () {

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
		}

		this.has = function (_node) {
			return !!this.item(_node);
		};

		return this;

	}).call([]);

	this.handleProperty(function () {

		this.action = function (_node, _name, _value, _property) {
			if (!this.actionables) {
				this.actionables = Actionables.create();
				attachActionHandler.call(this);	
			}

			this.actionables.add(_node, _value);
		};

	});

	this.actionables = null;
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

	this.open = function () {
		return this.addClass('OPEN');
	};

	this.close = function () {
		return this.removeClass('OPEN');
	};

	this.leave = function () {
		return this.close().addClass('LEAVE');
	};

});