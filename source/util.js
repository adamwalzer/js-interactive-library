/**
*  @desc 
*/
var util = new (function () {

	/**
	*  @desc Accepts one or more objects to combine their own properties to single object.
	*  @param _target (Object) The object that will recieve all members.
	*  @param _sources... (Object) The object(s) to join with the '_target'.
	*  @return _target
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
	*  @desc Matches the name of the key which references the given pointer inside an object. Like indexOf() for objects.
	*  @param _obj (Object) Object to search in.
	*  @param _member (*) The reference which is expected to be in the object as a property.
	*  @return (String) The name of the key in the object matching '_member'.
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
	*  @desc Matches the object, deep in the prototype chain, which is the owner of the property referencing the given pointer.
	*  @param _obj (Object) The object to search.
	*  @param _member (*) The reference which is expected to be a property in the prototype chain.
	*  @return (Object) An object containing the name of the property and the owning object. {name, object}
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

	this.random = function (_collection, _rangeB) {
		var index, val;

		index = Math.floor(Math.random()*_collection.length);

		if (arguments.length === 2) {
			val = Math.round(Math.random()*_rangeB);

			return val < _collection ? _collection : val;
		}

		if (index === _collection.length) index = _collection.length-1;

		return _collection && _collection[index];
	};

	this.transformId = function (_id, _camelCase) {
		if (_id && _camelCase) {
			return _id.replace(/[-\s]+([\w\d]?)/g, function (_match) {
				return RegExp.$1.toUpperCase();
			});
		}
		return _id && _id.replace(/[-\s]+/g, '_');
	};

	this.isSet = function () {
		return [].every.call(arguments, function (_arg) { return _arg != null });
	};

	this.toMillisec = function (_source) {
		var tokens, time, units;

		if (!_source) return;
		if (typeof _source === 'number') return _source;

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
	 *	   guardians: {David}, // property could be an array of multiple guardians.
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
	};

});

export default util;
