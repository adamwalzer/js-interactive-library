/**
*  Queue
*  @desc Contains...
*  @proto Array, Events, Basic
*/

import util from 'util';
import Collection from 'types/Collection';
import Events from 'types/Events';

var Queue = Collection.extend(function () {

	this.baseType = 'TYPE_QUEUE';

	this.ready = function (_record) {
		if (_record != null) this.remove(_record);

		if (!this.length) {
			this.trigger('complete');
		}

		return this;
	};
	
	util.mixin(this, Events);

	return this;

});

export default Queue;
