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
      //MPR, ll-trace 39: This may be a problematic loop. Complete fires ready, ready fires complete.
      //Probably the only reason this works is because the only purpose of this function is to remove
      //the last record and continue the cycle of audio events firing. Even with it working, it seems
      //unlikely that this is a stable or predictable configuration.
      this.trigger('complete');
    }

    return this;
  };

  util.mixin(this, Events);

  return this;

});

export default Queue;
