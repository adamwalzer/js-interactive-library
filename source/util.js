/**
 * Utility functions.
 * @namespace
 * @author Micah Rolon <micah@ginasink.com>
 * @memberof module:play~pl
 */
var util = new (function () {

  /**
   * Accepts one or more objects to combine their own properties to single object.
   * @arg {object} _target - The object that will recieve all members.
   * @arg {object} _sources... - The object(s) to join with the '_target'.
   * @returns {object} _target
   */
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

  /**
   * Matches the name of the key which references the given pointer inside an object. Like indexOf() for objects.
   * @arg {object} _obj - Object to search in.
   * @arg {*} _member - The reference which is expected to be in the object as a property.
   * @returns {string} The name of the key in the object matching '_member'.
   */
  this.keyOf = function (_obj, _member) {
    var member;

    for (member in _obj) {
      if (!_obj.hasOwnProperty(member)) continue;
      if (_obj[member] === _member) return member;
    }

    return null;
  };

  /**
   * Matches the object, deep in the prototype chain, which is the owner of the property referencing the given pointer.
   * @arg {object} _obj - The object to search.
   * @arg {*} _member - The reference which is expected to be a property in the prototype chain.
   * @return {object} An object containing the name of the property and the owning object. {name, object}
   */
  this.getOwner = function (_obj, _member) {
    var prototype, name;

    prototype = Object.getPrototypeOf(_obj);

    // keep searching until we go as deep as we can go.
    while (prototype) {
      // search for the key in the prototype
      name = util.keyOf(prototype, _member);

      // If we found the key in the prototype then we found
      // our match and we can break out of the loop.
      if (name) break;

      // Otherwise go deeper (thats what she said ;p)
      prototype = Object.getPrototypeOf(prototype);
    }

    return {
      name: name,
      object: prototype
    };
  };

  /**
   * Given a range; provides a random number in that range.
   * @function play~pl.util.random
   * @arg {number} _rangeA - A number for the low end of the range.
   * @arg {number} _rangeB - The top end of the range.
   * @returns {number|*} The resulting number in range or the member found at random.
   */

  /**
   * Given an iterable; provides a random item.
   * @arg {array} _collection - The iterable.
   * @returns {number|*} The member found at random.
   */
  this.random = function (_collection_rangeA, _rangeB) {
    var index, val;

    index = Math.floor(Math.random()*_collection_rangeA.length);

    if (arguments.length === 2) {
      val = Math.round(Math.random()*_rangeB);

      return val < _collection_rangeA ? _collection_rangeA : val;
    }

    if (index === _collection_rangeA.length) index = _collection_rangeA.length-1;

    return _collection_rangeA && _collection_rangeA[index];
  };

  /**
   * Take string and makes it dot notation friendly.
   * @arg {string} _id - The string to transform.
   * @arg {boolean} _camelCase - Transform with camel case.
   * @returns {string}
   */
  this.transformId = function (_id, _camelCase) {
    if (_id && _camelCase) {
      return _id.replace(/[-\s]+([\w\d]?)/g, function (_match) {
        return RegExp.$1.toUpperCase();
      });
    }

    return _id && _id.replace(/[-\s]+/g, '_');
  };

  /**
   * Test all arguments for != null
   * @return {boolean}
   */
  this.isSet = function () {
    return [].every.call(arguments, function (_arg) { return _arg != null });
  };

  /**
   * Parses a formated string and calculates it in milliseconds.
   * @arg {string} _source - The formated string for calculation in the pattern '1d 1h 1m 1s'.
   * @return {number}
   */
  this.toMillisec = function (_source) {
    var tokens, time, units;

    if (typeof _source === 'number') return _source;
    if (!_source) return;

    tokens = _source.split(/\s+/);
    time = 0;
    units = {
      d: 24*60*60*1000,
      h: 60*60*1000,
      m: 60*1000,
      s: 1000
    };

    tokens.forEach(function (_token) {
      var unit, value;

      unit = (_token.match(/[dhms]/) || [])[0];

      if (unit) {
        value = Number(_token.slice(0, -1));
        time += value * units[unit];
      }
      
      else {
        time += Number(_token);
      }
    });

    return time;
  };

  /**
   * Needs no introduction
   * @arg {iterable} _collection - iterable.
   * @return {array}
   */
  this.toArray = function (_collection) {
    return Array.prototype.map.call(_collection, function (i) { return i; });
  };

  /**
   * Resolves the value in the object at the given path.
   * @arg {object} _obj - The object to query.
   * @arg {string} _path - The path to the desired reference.
   * @returns {*} The resulting reference value.
   * @example
   * var user = {
   *   name: 'John',
   *   family: {
   *     guardians: {David}, // property could be an array of multiple guardians.
   *     siblings: [{Jane}, {Thomas}] // collection of user objects.
   *   }
   * };
   *
   * pl.util.resolvePath(user, 'family.sliblings[2].name');
   * // Matches the `guardians` propery if `guardians[0]` is undefined when `?` is used.
   * pl.util.resolvePath(user, 'family.guardians[0]?.name'); 
   */
  this.resolvePath = function (_obj, _path) {
    var path, obj, i, name, index, testArray;

    path = _path.split('.');
    obj = _obj;
    i = 0;

    while (obj) {
      testArray = (/\?$/).test(path[i]);
      index = (path[i].match(/\[(\d+)\]/) || [])[1] || -1;
      name = ~index ? path[i].slice(0, path[i].indexOf('[')) : path[i];
      obj = obj[name];

      if (~index && obj) {
        obj = testArray ? (obj[index] || obj) : obj[index];
      }
      
      i+=1;

      if (path.length === i) break;
    }

    return obj;
  };

  this.assignRef = function (_obj, _name, _ref) {
    var name;

    name = util.transformId(_name, true);

    if (_obj[name] === _ref) return _ref;

    if (_obj[name]) {
      if (!_obj[name].__refCollction__) {
        _obj[name] = [_obj[name]];

        Object.defineProperty(_obj[name], '__refCollction__', {
          value: true,
          enumerable: false,
          writeable: false,
          configureable: false
        });
      }
      
      _obj[name].push(_ref);
    }

    else {
      _obj[name] = _ref;
    }

    return _obj[name];
  };

  /**
   * N0 OPeration.
   */
  this.noop = function() {};

  /**
   * Get the file name out of a simple file path.
   * @arg {string} _path - The file path. 
   * @returns {string} The extracted name.
   */
  this.resolveFileName = function (_path) {
    return _path.slice(_path.lastIndexOf('/')+1);
  };

  /**
   * Produces a string following the specied pattern. Which is a mix of x, y, z and - characters.
   * - x; produces a letter a-f.
   * - y; produces a digit 0-9.
   * - z; produces a 4 character hex value derived from the now time stamp.
   * @arg {string} _pattern - The xyz pattern.
   * @returns {string} The generated ID.
   */
  this.createId = function (_pattern) {
    return (_pattern || 'xy-z').replace(/[xyz]/g, function (_token) {
      if (_token === 'x') return (Math.floor(Math.random() * 5) + 10).toString(16);
      if (_token === 'y') return (Math.floor(Math.random() * 10)).toString(16);
      return Math.floor(Math.random() * Date.now()).toString(16).slice(0, 4);
    });
  };

});

export default util;
