export var Basic;

/**
*  @desc Declares a new object type within the library.
*  @param _def (String) Defines the name of the type and/or specifies the name of the type which is its prototype.
*  @param _implementation (Function|Object) Optional. The implementation of the new type as either a constructor function or object to mixin.
*  @return (Basic) Returns a new type with 'Basic' as its base type.
*/
export default function type (_def, _implementation) {
	var tokens, name, prototype;

	tokens = _def.split(/\s*:\s*/);
	name = tokens[0];
	prototype = tokens[1] && type[tokens[1]];

	if (tokens[1] && !prototype) {
		throw ReferenceError('Unable to find type '+tokens[1]);
	}

	// Simply create a new instance if a definition has not been
	return type[name] = _implementation ? (prototype || Basic).extend(_implementation) : (prototype || Basic).create();
}

/**
*  @desc The base type for all objects which will act as prototypes.
*/
Basic = new (function () {
	
	/**
	*  @desc Creates a new object with the current object as its prototype.
	*  @return (Object) The new instance.
	*/
	this.create = function () {
		return Object.create(this);
	};

	/**
	*  @desc Creates a new object using a constructor function or object with the current object as its prototype.
	*  @param _implementation (Function|Object) The implementation of the new type as either a constructor function or object to mixin.
	*  @return (Basic) The new instance.
	*
	*  TODO: define constructor property
	*/
	this.extend = function (_implementation) {
		var instance;

		if (!_implementation) return null;

		switch (typeof _implementation) {
			case 'function':
				_implementation.prototype = this;
				instance = new _implementation();
				break;

			case 'object':
				instance = this.create();
				instance.mixin(_implementation);
				break;

			default:
				console.error('TypeError: Invalid type given for object extention.', typeof _implementation);
		}

		return instance;
	};

	/**
	*  @desc Accepts one or more objects to combine their own properties to the instance.
	*  @param _sources... (Object) The object(s) to join with the '_target'.
	*  @return _target
	*/
	this.mixin = function () {
		return util.mixin.apply(null, [this].concat([].slice.call(arguments, 0)));
	};

	/**
	*  @desc Matches the name of the key which references the given pointer inside the instance. Like indexOf() for objects.
	*  @param _member (*) The reference which is expected to be in the object as a property.
	*  @return (String) The name of the key in the object matching '_member'.
	*/
	this.keyOf = function (_member) {
		return util.keyOf(this, _member);
	};

	/**
	*  @desc Performs a super callback of the function which called it. Allowing you to still invoke a method which was overridden.
	*  @param ... (*) Whatever amount of arguments the caller takes.
	*  @return (*) Whatever the caller returns.
	*/
	this.sup = function () {
		var method, name, owner, prototype;

		// Get the function which invoked sup() in the call stack.
		method = this.sup.caller;

		// Check to see if 'this' owns the method.
		// NOTE: We may want to move this logic into getOwner().
		// 
		if (name = this.keyOf(method)) {
			prototype = Object.getPrototypeOf(this);
		}

		// Otherwise find the object which owns the caller function.
		else {
			owner = util.getOwner(this, method);
			name = owner.name;
			prototype = Object.getPrototypeOf(owner.object);	
		}
		
		method = prototype[name];

		if (!method) {
			console.error('ReferenceError: Unable to locate prototype method.', this.sup.caller);
			return null;
		}

		return method.apply(this, arguments);
	};

});