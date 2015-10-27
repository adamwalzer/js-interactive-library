/**
*  PlayJS (temporary name)
*  
*  @author Micah Rolon <micah@ginasink.com>
*  @description A simple and beautiful game development library.
*/

var Play, pl;

Play = pl = new (function () {

	var util, Basic, SCOPE;

	// TODO: Implement dot notation parsing for type namespacing.
	// 
	function type (_name, _constructor_object) {
		var tokens, name, prototype;

		tokens = _name.split(/\s*:\s*/);
		name = tokens[0];
		prototype = tokens[1] && type[tokens[1]];

		return type[name] = (prototype || Basic).extend(_constructor_object);
	}

	util = new (function () {

		this.mixin = function () {
			var member, i, target, objs;

			target = arguments[0];
			objs = [].slice.call(arguments, 1);

			for (i=0; i < objs.length; i+=1) {
				for (member in objs[i]) {
					if (!objs[i].hasOwnProperty(member)) continue;
					target[member] = objs[i][member];
				}
			}

			return target;
		};

		this.keyOf = function (_obj, _member) {
			var member;

			for (member in _obj) {
				if (!_obj.hasOwnProperty(member)) continue;
				if (_obj[member] === _member) return member;
			}

			return null;
		};

		this.getOwner = function (_obj, _method) {
			var prototype, name;

			prototype = Object.getPrototypeOf(_obj);

			while (prototype) {
				name = util.keyOf(prototype, _method);

				if (name) break;

				prototype = Object.getPrototypeOf(prototype);
			}

			return {
				name: name,
				object: prototype
			};
		};

	});

	Basic = new (function () {
		
		this.create = function () {
			return Object.create(this);
		};

		// TODO: define constructor property
		// 
		this.extend = function (_constructor_object) {
			var instance;

			if (!_constructor_object) return null;

			switch (typeof _constructor_object) {
				case 'function':
					_constructor_object.prototype = this;
					instance = new _constructor_object();
					break;

				case 'object':
					instance = this.create();
					instance.mixin(_constructor_object);
					break;

				default:
					console.error('TypeError: Invalid type given for object extention.', typeof _constructor_object);
			}

			return instance;
		};

		this.mixin = function () {
			return util.mixin.apply(null, [this].concat([].slice.call(arguments, 0)));
		};

		this.keyOf = function (_member) {
			return util.keyOf(this, _member);
		};

		this.sup = function () {
			var owner, prototype;

			owner = util.getOwner(this, this.sup.caller);
			prototype = Object.getPrototypeOf(owner.object);

			return prototype[owner.name].apply(this, arguments);
		};

	});

	type('Events', function () {
		var i, method, methods;

		function createProxyFunction (_name) {
			return function () {
				return $.fn[_name].apply(this, arguments);
			};
		}

		methods = ['on', 'off', 'trigger'];

		for (i=0; method = methods[i]; i+=1) {
			this[method] = createProxyFunction(method);
		}
	});

	type('jQProxy', function () {
		var method, exclude;

		function createProxyFunction (_name) {
			return function () {
				return $.fn[_name].apply(this.$els, arguments);
			};
		}

		exclude = ['constructor'].concat(Object.keys(Basic));

		this.$els = null;

		for (method in $.fn) {
			if (!$.fn.hasOwnProperty(method) || ~exclude.indexOf(method)) continue;
			this[method] = createProxyFunction(method);
		}
	});

	type('Scope : jQProxy', function () {
		
		this.game = null;

	});

	// Global Game scope.
	SCOPE = type.Scope.create();

	type.Entity = SCOPE.extend(function () {
		// body...
	});
	
	this.game = (function () {
		var GAMES;

		function game (_name) {
			if (game.isReady) {
				initialize(_name);
			}

			else {
				register(_name);
			}
		}

		function ready (_event) {
			game.isReady = true;
			game.trigger('ready');

			initialize(GAMES);
		}

		function register (_name) {
			// body...
		}

		function initialize (_name_collection) {
			switch (typeof _name_collection) {
				case 'string':

					break;
					
				case 'object':

					break;
			}
		}

		GAMES = [];

		util.mixin(game, Events);

		document.addEventListener('DOMContentLoaded', ready, false);
		
		return game;

	}());

	this.game.component = function () {};
	this.game.component.config = function () {};

	this.type = type;
	this.util = util;

});