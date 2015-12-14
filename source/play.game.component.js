/**
 * Defines the `component()` method for component behavior registration. This method is also a namesapce for methods to manage and load component behavior scripts.
 *
 * @module
 * @author Micah Rolon <micah@ginasink.com>
 *
 * @requires play~pl.util
 * @requires types/Events
 */
import util from 'util';
import Events from 'types/Events';

/**
 * Collection of component behavior records
 * @const
 */
var COMPONENTS;

/**
 * Registers a component behavior.
 * @arg {string} _name - The name for the component.
 * @arg {function|object} _implementation - Constructor function or object with the behavior's implementation.
 * @returns {@link module:play~pl.game}
 */
function component (_name, _implementation) {
	if (!component.get(_name)) {
		COMPONENTS.push({
			name: _name,
			implementation: _implementation,
			config: {}
		});
	}

	return this;
}

COMPONENTS = [];

/**
 * Methods to manage and load component behavior scripts.
 * @namespace component
 * @memberof module:play~pl.game
 * @mixes Events
 */
(function () {
	
	util.mixin(this, Events);

	/**
	 * Given a name; provides the component record. `{name, implementation}`
	 * @memberof module:play~pl.game.component
	 * @arg {string} _name - The name of the component.
	 * @returns {object} The record.
	 */
	this.get = function (_name) {
		var i, record;

		for (i=0; record = COMPONENTS[i]; i+=1) {
			if (record.name === _name) return record;
		}

		return null;
	};

	/**
	 * Loads the script for the component. The HTML and CSS will be loaded when the component scope initalizes.<br>
	 * The path of the script file is resolved `{pl.game.config.componentDirectory}/{_name}/behavior.js`.
	 * @memberof module:play~pl.game.component
	 * @arg {string} _name - The name of the component.
	 * @arg {function} _callback - Callback for load success.
	 * @todo Implement Promises.
	 * @returns `this`
	 */
	this.load = function (_name, _callback) {
		var path

		if (component.get(_name)) {
			if (_callback) _callback.call(component, _name);
			return null;
		}

		path = pl.game.config('componentDirectory')+_name+'/behavior.js';

		$.getScript(path, function () {
			if (_callback) _callback.call(component, _name);
			component.trigger('loaded', [_name]);
		});

		return this;
	};

	/**
	 * Loads all the component scripts for HTML elements with `pl-component` attributes.
	 * @memberof module:play~pl.game.component
	 * @arg {function} _callback - Callback for load success.
	 * @todo Implement Promises.
	 * @returns `this`
	 */
	this.loadAll = function (_callback) {
		var $components, queue;

		$components = $('[pl-component]');
		queue = [];

		$components.each(function (_index) {
			var name;

			name = $(this).attr('pl-component');

			if (~queue.indexOf(name)) return;

			queue.push(name);
		});

		queue.slice(0).forEach(function (_name) {
			component.load(_name, function () {
				var index;

				index = queue.indexOf(_name);
				queue.splice(index, 1);

				if (!queue.length && _callback) _callback.apply(component, arguments)
			});
		});

		return this;
	};

	// Maybe?
	// this.config = function () {};

}).call(component);

export default component;
