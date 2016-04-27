/**
 * Base object type for 'classes' implementing methods for extention and super callbacks.
 * @module
 * @requires module:play~pl.util
 */
import util from 'util';

/**
 * <span class="important">NOTE:</span> This is NOT a constructor. use `Basic.create()` to get a new instance.
 * @classdesc The base type for all objects which will act as prototypes.
 * @class
 */
var Basic = {
  /**
   * Objects with this as an own property will be identified as the root object.
   * @readonly
   * @default
   */
  baseType: 'TYPE_BASIC',

  /**
   * Creates a new object with the current object as its prototype.
   * @instance
   * @returns {Basic} The new instance.
   */
  create: function () {
    return Object.create(this);
  },

  /**
   * Creates a new object using a constructor function or object with the current object as its prototype.
   * @instance
   * @arg {Function|Object} _implementation - The implementation of the new type as either a constructor function or object to mixin.
   * @returns {Basic} The new instance.
   *
   * @todo define constructor property
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
   * Accepts one or more objects to combine their own properties to the instance.
   * @instance
   * @arg {object} _sources... - The object(s) to join with the instance.
   * @returns this
   */
  mixin: function () {
    return util.mixin.apply(null, [this].concat([].slice.call(arguments, 0)));
  },

  /**
   * Matches the name of the key which references the given pointer inside the instance. Like indexOf() for objects.
   * @instance
   * @arg {*} _member - The reference which is expected to be in the object as a property.
   * @returns {string} The name of the key in the object matching '_member'.
   */
  keyOf: function (_member) {
    return util.keyOf(this, _member);
  },

  /**
   * Performs a super callback of the function which called it. Allowing you to still invoke a method which was overridden.
   * @instance
   * @arg {*} _args... - Whatever amount of arguments the caller takes.
   * @returns {*} Whatever the caller returns.
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

  /**
   * Performs a super callback of the function which called it. Unlike `proto()` which looks for the overidden method, sup looks for the base class' implementation.
   * @instance
   * @arg {*} _args... - Whatever amount of arguments the caller takes.
   * @returns {*} Whatever the caller returns.
   */
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

  /**
   * Provides the object type.
   * @instance
   */
  toString: function () {
    var type;

    if (this.baseType) {
      type = this.baseType.replace('TYPE_', '');
      type = type.slice(0, 1) + type.slice(1).toLowerCase();
    } else {
      type = this.constructor.name || 'Object';
    }

    return '[object ' + type + ']';
  }

};

export default Basic;
