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
	 * Given an iterable; provides a random item. Given a range; provides a random number in that range.
	 * @arg {array|number} _collection_rangeA - The iterable or a number for low end of the range.
	 * @arg {number} _rangeB - The top end of the range.
	 * @returns {number|*} The resulting number in range or the member found at random.
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
	 * @returns {string}
	 */
	this.transformId = function (_id) {
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

});

export default util;