/**
*  Events
*  @desc Contains methods for managing and dispatching events from objects.
*  @proto Basic
*/

import Basic from 'types/Basic';

var Events = Basic.extend(function () {
  var i, method, methods;
  /**
  *  @desc Creates a function with a proxy to the jQuery method.
  *  @param _name (String) The name of the method being proxied.
  *  @return (jQuery|*) Either a jQuery object or whatever the original method returns.
  *  @private
  */
  function createProxyFunction(_name) {
    return function () {
      var $jq = $();
      // We must wrap our object in jQuery. If 'typeof this' is a function then we need
      // to add it in this manner, otherwise jQuery treats it like a ready callback.
      $jq.push(this);

      return $.fn[_name].apply($jq, arguments);
    };
  }

  methods = ['on', 'off', 'trigger'];

  this.baseType = 'TYPE_EVENTS';

  for (i = 0; method = methods[i]; i += 1) {
    this[method] = createProxyFunction(method);
  }
});

export default Events;
