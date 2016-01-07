/**
*  jQProxy
*  @desc Contains all the jQuery methods targeted towards a property which references a jQuery object.
*  @proto Basic
*  
*  NOTE: Custom events may trigger on scopes
*  that also targets the same elments. Testing needed.
*/

import util from 'util';
import Basic from 'types/Basic';

var jQProxy = Basic.extend(function () {
	var method, exclude;

	/**
	*  @desc Creates a function with a proxy to the jQuery method.
	*  @param _name (String) The name of the method being proxied.
	*  @return (jQuery|*) Either a jQuery object or whatever the original method returns.
	*  @private
	*/
	function createProxyFunction (_name) {
		return function () {
			var response;

			// This makes sure your not calling any jQuery methods before initialization.
			if (!this.hasOwnProperty('$els')) {
				if (_name === 'on') {
					this.registerHandler(arguments);
				}

				else {
					throw new ReferenceError('Unable to invoke '+_name+' because the scope is not initialized.');
				}
				return;
			}

			response = $.fn[_name].apply(this.$els, resolveEventHandler(this, _name, arguments));

			if (response === this.$els || (response && response.jquery && response.is(this.$els))) {
				return this;
			}

			return response;
		};
	}

	function resolveEventHandler (_scope, _method, _args) {
		var i, arg, args;

		args = [];

		if (~(['on', 'load']).indexOf(_method)) {
			for (i=0; arg = _args[i]; i+=1) {
				if (typeof arg === 'function') {
					args.push((function (_handler) {
						return function () { return _handler.apply(_scope, arguments);};
					}(arg)));
				}

				else {
					args.push(arg);
				}
			}

			return args;
		}

		return _args;
	}

	// We don't want jQuery methods overridding our base type's methods.
	exclude = ['constructor'].concat(Object.keys(Basic));

	this.baseType = 'TYPE_JQPROXY';
	this.$els = null;
	this.eventRegistry = null;

	for (method in $.fn) {
		if (!$.fn.hasOwnProperty(method) || ~exclude.indexOf(method)) continue;
		this[method] = createProxyFunction(method);
	}

	this.node = function () {
		return this.$els[0];
	};

	// TODO: make this private
	this.registerHandler = function (_definition) {
		if (!this.hasOwnProperty('eventRegistry')) {
			if (this.eventRegistry && this.isMemberSafe('eventRegistry')) {
				this.eventRegistry = this.eventRegistry.slice(0);
			}

			else {
				this.eventRegistry = [];
			}
		}

		this.eventRegistry.push(_definition);
	};

	this.attachEvents = function () {
		var self;

		self = this;

		if (this.eventRegistry && this.isMemberSafe('eventRegistry')) {
			this.eventRegistry.forEach(function (_definition) {
				self.on.apply(self, _definition);
			});
		}
	};

	// Wraps you function 'this' to the scope.
	// 
	this.bind = function (_handler) {
		var scope, dataArgs;

		scope = this;
		dataArgs = [].slice.call(arguments, 1);

		return function () {
			var args;

			args = [].slice.call(arguments, 0);
			return _handler.apply(scope, args.concat(dataArgs));
		};
	};

	this.findOwn = function (_selector) {
		return this.find(_selector).filter(this.bind(function (_index, _node) {
			var $node;

			$node = $(_node);

			if ($node.hasClass('pl-scope')) {
				return $node.parent().scope() === this;
			}

			return $node.scope() === this;
		}));
	};

	this.isMemberSafe = function (_name) {
		var owner, elOwner, prototype;

		if (this.hasOwnProperty(_name)) {
			return true;
		}

		else {
			prototype = Object.getPrototypeOf(this);
			owner = util.getOwner(this, this[_name]);

			if (owner.object.hasOwnProperty('$els') || prototype.hasOwnProperty('$els')) return false;

			if (prototype.$els) {
				elOwner = util.getOwner(prototype, prototype.$els);

				if (owner.object.isPrototypeOf(elOwner.object)) {
					return false;
				}
			}
			
			return true;
		}

		return false;
	};

	this.is = function (_obj) {
		if (!_obj) return false;
		if (_obj.$els) return this.$els.is(_obj.$els);

		return this.$els.is(_obj);
	};
});

export default jQProxy;
