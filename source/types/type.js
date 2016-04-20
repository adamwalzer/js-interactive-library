"use strict";
/**
 * Defines an Object type using a named constructor function.
 * @module
 */

/**
 * Constructs an object with methods bound to a context.
 * @arg {object} _from - Object with methods to bind.
 * @arg {object} _to - Context which methtods should be bound to.
 */
function Bindings (_from, _to) {
  var method;

  // pull all methods from the prototype chain.
  for (method in _from) {
    if (typeof _from[method] !== 'function') continue;
    this[method] = _from[method].bind(_to);
  }
}

/**
 * Takes an itterable object and convert it into an Array.
 * @arg {object} _itterable
 * @returns {array}
 */
function toArray (_itterable) {
  return [].map.call(_itterable, function (m) { return m; });
}

/**
 * Converts a constructor function into an object "type". Which addapts the constructor with and interface for creating instsances and extension.
 * @arg {function} _constructor... - any number of constructor functions.
 * @returns The constructor or an object containing all the defined types.
 */
export default function type () {
  var defs, module;

  /**
   * Constructs an interface which is accesed through the constructors arguments.
   * These arguments are parsed from the function string and collected into an array.
   * @arg {function} _constructor
   * @returns {array} The collection of API functions requested by the constructor.
   */
  function createApi (_constructor) {
    var args, api;

    // Matches the names of the arguments defined in the source of the function.
    // [^\(\)\.\s,]+ captures one or more of any character which is NOT a parenthetical, period, white-space character, or comma.
    // It then takes that rule and looks for multiple intances w/o spaces or commas around it, which would be encased in parenthensies.
    // NOTE: since this regex is not matching globally, it will not match any argument clusters past the function definition.
    args = (Function.prototype.toString.call(_constructor).match(/\(((?:\s*[^\(\)\.\s,]+\s*,?)+)\)/)||['',''])[1].split(/\s*,\s*/);
    api = {
      /**
       * Invokes the specified method closest in the prototype chain. Allowing you to still invoke a method which was overridden.
       *
       * @arg {object} _obj - The context which to find the parent function.
       * @arg {string} _name - The method name.
       * @arg {array} _args - A collection of arguments to invoke the method with
       * @returns {*} Whatever the caller returns.
       *
       * @example 
       * Car.extend(function Ford (proto) {
       *     this.drive = function () {
       *         proto(this, 'drive', arguments);
       *         // do some opps.
       *     };
       * });
       */
      proto: function (_obj, _name, _args) {
        var proto, method;

        proto = Object.getPrototypeOf(this || _obj);
        method = proto[_name];

        if (typeof _obj[_name] !== 'function') {
          throw new TypeError('Member '+_name+' is not a function.');
        }

        if (method) {
          // Does _obj's prototype have the method and it's not the same reference as _obj.
          if (proto.hasOwnProperty(_name) && _obj[_name] !== proto[_name]) {
            return _args ? method.apply(_obj, _args) : method.bind(_obj);
          }

          // Otherwise, walk the prototype chain to find the prototype that has the parent method.
          while (proto) {
            if (proto.hasOwnProperty(_name) && _obj[_name] !== proto[_name]) {
              return _args ? method.apply(_obj, _args) : method.bind(_obj);
            }

            proto = Object.getPrototypeOf(proto);
          }
        } else {
          return new Bindings(proto, _obj);
        }
      },
      /**
       * Invokes the specified method which lives on the object type's prototype.
       * If your instance overrides the object types method, or your many prototype
       * levels away from the base prototype, this lets you track back to the original.
       *
       * @arg {object} _obj - The context which to find the parent function.
       * @arg {string} _name - The method name.
       * @arg {array} _args - A collection of arguments to invoke the method with
       * @returns {*} Whatever the caller returns.
       */
      base: function (_obj, _name, _args) {
        var proto, method;

        proto = _constructor.prototype;
        method = proto[_name];

        if (typeof method !== 'function') {
          throw new TypeError('Member '+_name+' is not a function.');
        }

        if (method) {
          return _args ? method.apply(_obj, _args) : method.bind(_obj);
        } else {
          return new Bindings(proto, _obj);
        }
      },
      /**
       * Invokes the specified method on the object type's super type or parent type (i.e. Ford extending Car).
       * @arg {object} _obj - The context which to find the parent function.
       * @arg {string} _name - The method name.
       * @arg {array} _args - A collection of arguments to invoke the method with
       * @returns {*} Whatever the caller returns.
       */
      sup: function (_obj, _name, _args) {
        return api.proto.apply(_constructor.prototype, arguments);
      },
      /**
       * Defines a properpty which is configured `{configureable: false, writeable: false}`.
       * @arg {object} _obj - The context which to define members.
       * @arg {string} _name - The member name.
       * @arg {*} _value - The value.
       * @returns api
       */
      constant: function (_obj, _name, _value) {
        Object.defineProperty(_obj, _name, {
          value: _value,
          configureable: false,
          writeable: false
        });

        return api;
      },
      /**
       * Defines members on the constructor.
       * @function static
       * @overload
       * @arg {string} _name - The member name.
       * @arg {*} _value - The value.
       * @returns api
       */

      /**
       * Defines members on the constructor.
       * @arg {object} _def - An object with members to mixin.
       * @returns api
       */
      static: function (_name_def, _value) {
        var member, _name, _def;

        _value ? _name = _name_def : _def = _name_def;

        if (_def) {
          for (member in _def) {
            if (!_def.hasOwnProperty(member)) continue;
            _constructor[member] = _def[member];
          }
        }

        if (_name) {
          _constructor[_name] = _value;
        }

        return api;
      },
      /**
       * A pretty way of define the interface of your object type.
       *
       * You may pass any number of arguments as functions or strings.
       * 
       * **Example**
       * ```javascript
       * function Car ($) {$(
       *     // Defines a member assigned to `null`.
       *     'name',
       *     // Defines members with values as a string and number. Keep in mind these are put on the prototype.
       *     'engineType = "standard", speed = 0',
       *
       *     // Define instance members.
       *     function alloc (_name) {
       *         this.name = _name;
       *     },
       *
       *     function drive () {
       *         this.speed += 1;
       *     }
       * )}
       * ```
       *
       * One benefit to this interface is that all your methods are named so you have easy access for recursive programs.
       * @arg {string|function} _def - A string of property definitions or a named function.
       * @todo Support property assignment in alloc. Micah: 2/24/2016
       */
      $: function () {
        var args = toArray(arguments);

        args.forEach(function (_member) {
          var memberType, props, key;

          memberType = typeof _member;

          switch (memberType) {
            case 'string':
              props = _member.split(/\s*,\s*/);

              if (props) {
                props.forEach(function (_def) {
                  var prop, val;
                  
                  prop = _def.split(/\s*[:=]\s*/);
                  try { val = JSON.parse(prop[1]) } catch (e) {}
                  _constructor.prototype[prop[0]] = (typeof prop[1] !== 'undefined') ? val || prop[1] : null;
                });
              }
              break;

            case 'object':
              for (key in _member) {
                if (!_member.hasOwnProperty(key)) continue;
                _constructor.prototype[key] = _member[key];
              }
              break;

            case 'function':
              if (!_member.name) throw TypeError('Member must be a named function.');
              _constructor.prototype[_member.name] = _member;
              break;
          }
        });

        return api;
      }
    }

    return args.map(function (_call) {
      return api[_call] || module[_call];
    });
  }

  defs = toArray(arguments);
  module = (!this) ? {} : this;

  defs.forEach(function (_constructor) {
    var api;

    if (typeof _constructor === 'object') {
      var Super, keys = Object.keys(_constructor);

      if (keys.length === 1 && module[keys[0]]) {
        Super = module[keys[0]];
        return Super.extend.call(module, _constructor[keys[0]]);
      }
    }

    api = createApi(_constructor);

    /**
     * Creates a new instance of the constructor prototype.
     * This also invokes the `alloc()` on the instance so you can define instance props.
     * @arg {*} ... - Any number of arguments for `alloc()`.
     * @returns instance
     */
    _constructor.create = function () {
      var instance = Object.create(_constructor.prototype);
      if (typeof instance.alloc === 'function') instance.alloc.apply(instance, arguments);
      return instance;
    };

    /**
     * Extends the provided constructor prototype.
     * @arg {function} _definition - Constructor for the object type.
     * @returns _constructor
     */
    _constructor.extend = function (_definition) {
      _definition.prototype = Object.create(_constructor.prototype, {
        constructor: {
          value: _definition,
          enumerable: false,
          writeable: false,
          configureable: false
        }
      });
      
      return type.call(this === _constructor ? null : this, _definition);
    }

    _constructor.apply(_constructor.prototype, api);

    module[_constructor.name] = _constructor;
  });

  return defs.length > 1 ? module : defs[0];
}
