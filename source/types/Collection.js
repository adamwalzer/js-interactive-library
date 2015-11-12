/**
*  Collection
*  @desc Contains...
*  @proto Array, Basic
*/

import util from 'util';
import Basic from 'types/Basic';

var Collection = (function () {

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
	
	util.mixin(this, Basic);

	return this;

}).call([]);

export default Collection;