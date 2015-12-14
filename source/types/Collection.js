/**
 * Collections are iterables which hold a consistent interface throughout its indexes.
 *
 * @module
 * @requires module:types/BasicArray
 */
import BasicArray from 'types/BasicArray';

/**
 * <span class="important">NOTE:</span> This is NOT a constructor. use `Collection.create()` to get a new instance.
 * @classdesc Iterable holding record objects of the same interface.
 * @class
 * @extends module:types/BasicArray~BasicArray
 */
var Collection = BasicArray.extend(function () {
	/**
	 * Gets the record object which has `_member` as a member.
	 * @instance
	 * @protected
	 * @memberof module:types/Collection~Collection
	 * @arg {*} _member - object reference to search for.
	 * @arg {string} _key - the target key to test the `_member` against.
	 * @arg {boolean} _shouldCollect - <span style="color: blue; font-weight: bold;">`true`</span>: collect all matching elements.<br>
	 * <span style="color: blue; font-weight: bold;">`false`</span>: return first result.
	 */
	function getRecord (_member, _key, _shouldCollect) {
		var i, record, member, result;

		result = [];

		for (i=0; record = this[i]; i+=1) {
			if (_key !== undefined) {
				if (record[_key] === _member) {
					if (_shouldCollect) {
						result.push(record);
					}

					else {
						return record;
					}
				}
			}

			else if (record instanceof Array) {
				if (~record.indexOf(_member)) {
					if (_shouldCollect) {
						result.push(record);
					}

					else {
						return record;
					}
				}
			}

			else {
				for (member in record) {
					if (!record.hasOwnProperty(member)) continue;
					if (record[member] === _member) {
						if (_shouldCollect) {
							result.push(record);
						}

						else {
							return record;
						}
					}
				}
			}
		}

		return result.length ? result : null;
	}

	/**
	 * Objects with this as an own property will be identified as the root object.
	 * @memberof module:types/Collection~Collection
	 * @readonly
	 * @default
	 */
	this.baseType = 'TYPE_COLLECTION';

	this.add = function (_record) {
		if (~this.indexOf(_record)) return false;
		this.push(_record);

		return this;
	};

	this.remove = function (_record) {
		var index;

		index = this.indexOf(_record);
		if (~index) this.splice(index, 1);

		return this;
	};

	this.has = function (_record) {
		return !!~this.indexOf(_record);
	};

	this.get = function (_member, _key) {
		return getRecord.call(this, _member, _key);
	};

	this.filter = function (_member, _key) {
		return getRecord.call(this, _member, _key, true);
	};

});

export default Collection;