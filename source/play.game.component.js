import util from 'util';
import Events from 'types/Events';

var COMPONENTS;

export default function component (_name, _implementation) {
	if (!component.get(_name)) {
		COMPONENTS.push({
			name: _name,
			implementation: _implementation
		});
	}

	return this;
}

COMPONENTS = [];

(function () {
	
	util.mixin(this, Events);

	this.get = function (_name) {
		var i, record;

		for (i=0; record = COMPONENTS[i]; i+=1) {
			if (record.name === _name) return record;
		}

		return null;
	};

	// This only loads the script for the component. The markup and
	// css will be loaded when the compent scope initalizes.
	// 
	this.load = function (_name, _callback) {
		var path

		path = pl.game.config('componentDirectory')+_name+'/behavior.js';

		$.getScript(path, function () {
			if (_callback) _callback.apply(component, arguments);
			component.trigger('loaded', [_name]);
		});
	};

	this.loadAll = function (_callback) {
		var queue;

		queue = [];

		$('[pl-component]').each(function () {
			var name;

			name = $(this).attr('pl-component');

			if (~queue.indexOf(name)) return;
			
			console.log('** loading component', name);

			queue.push(name);
			component.load(name, function () {
				var index;

				index = queue.indexOf(name);
				queue.splice(index, 1);

				if (!queue.length && _callback) _callback.apply(component, arguments)
			});
		});

		return this;
	};

	// Maybe?
	// this.config = function () {};

}).call(component);