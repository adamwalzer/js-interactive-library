/**
*  Collection
*  @desc Contains...
*  @proto Array, Basic
*/

import util from 'util';
import Basic from 'types/Basic';

var Collection = (function () {

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
		var i, record, member;

		for (i=0; record = this[i]; i+=1) {
			if (_key !== undefined) {
				if (record[_key] === _member) return record;
			}

			else if (record instanceof Array) {
				if (~record.indexOf(_member)) return record;
			}

			else {
				for (member in record) {
					if (!record.hasOwnProperty(member)) continue;
					if (record[member] === _member) return record;
				}
			}
		}

		return null;
	};
	
	util.mixin(this, Basic);

	return this;

}).call([]);

export default Collection;