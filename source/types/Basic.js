/**
*  Basic
*  @desc The base type for all objects which will act as prototypes.
*/
import util from 'util';

var Basic = {

	baseType: 'TYPE_BASIC',
	
	/**
	*  @desc Creates a new object with the current object as its prototype.
	*  @return (Object) The new instance.
	*/
	create: function () {
		return Object.create(this);
	},

	/**
	*  @desc Creates a new object using a constructor function or object with the current object as its prototype.
	*  @param _implementation (Function|Object) The implementation of the new type as either a constructor function or object to mixin.
	*  @return (Basic) The new instance.
	*
	*  TODO: define constructor property
	*/
	extend: function (_implementation) {
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
	},

	/**
	*  @desc Accepts one or more objects to combine their own properties to the instance.
	*  @param _sources... (Object) The object(s) to join with the '_target'.
	*  @return _target
	*/
	mixin: function () {
		return util.mixin.apply(null, [this].concat([].slice.call(arguments, 0)));
	},

	/**
	*  @desc Matches the name of the key which references the given pointer inside the instance. Like indexOf() for objects.
	*  @param _member (*) The reference which is expected to be in the object as a property.
	*  @return (String) The name of the key in the object matching '_member'.
	*/
	keyOf: function (_member) {
		return util.keyOf(this, _member);
	},

	/**
	*  @desc Performs a super callback of the function which called it. Allowing you to still invoke a method which was overridden.
	*  @param ... (*) Whatever amount of arguments the caller takes.
	*  @return (*) Whatever the caller returns.
	*/
	proto: function () {
		var method, name, owner, prototype;

		// Get the function which invoked proto() in the call stack.
		// If the caller is a behavior then we retrieve the method.
		method = this.proto.caller.method || this.proto.caller;

		// Check to see if 'this' owns the method.
		// NOTE: We may want to move this logic into getOwner().
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
			console.error('ReferenceError: Unable to locate prototype method.', this.proto.caller);
			debugger;
			return null;
		}

		return method.apply(this, arguments);
	},

	sup: function () {
		var method, name, owner, prototype;

		// Get the function which invoked sup() in the call stack.
		method = this.sup.caller;
		owner = util.getOwner(this, this.baseType);
		prototype = owner.object;
		name = this.keyOf(method);

		// Check to see if 'this' owns the method.
		// NOTE: We may want to move this logic into getOwner().
		// 
		if (!name) {
			owner = util.getOwner(this, method);
			name = owner.name;
		}

		method = prototype[name];

		if (!method) {
			console.error('ReferenceError: Unable to locate prototype method.', this.sup.caller);
			return null;
		}

		return method.apply(this, arguments);
	},

	toString: function () {
		var type;
		
		type = this.baseType.replace('TYPE_', '');
		type = type.slice(0,1)+type.slice(1).toLowerCase();

		return '[object '+type+']';
	}

};

export default Basic;