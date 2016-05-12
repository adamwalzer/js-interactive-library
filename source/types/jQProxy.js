/**
*  jQProxy
*  @desc Contains all the jQuery methods targeted towards a property which references a jQuery object.
*  @proto Basic
*
*  NOTE: Custom events may trigger on scopes
*  that also targets the same elments. Testing needed.
*/

import util from 'util';
import Basic from 'types/Basic';

var jQProxy = Basic.extend(function () {
  var method, exclude;

  /**
  *  @desc Creates a function with a proxy to the jQuery method.
  *  @param _name (String) The name of the method being proxied.
  *  @return (jQuery|*) Either a jQuery object or whatever the original method returns.
  *  @private
  */
  function createProxyFunction(_name) {
    return function () {
      var response;

      // This makes sure your not calling any jQuery methods before initialization.
      if (!this.hasOwnProperty('$els')) {
        if (_name === 'on') {
          registerHandler.call(this, arguments);
        } else {
          throw new ReferenceError('Unable to invoke ' + _name + ' because the scope is not initialized.');
        }
        return;
      }

      response = $.fn[_name].apply(this.$els, resolveEventHandler(this, _name, arguments));

      if (response === this.$els || (response && response.jquery && response.is(this.$els))) {
        return this;
      }

      return response;
    };
  }

  function resolveEventHandler(_scope, _method, _args) {
    var i, arg, args;

    args = [];

    if (~(['on', 'load']).indexOf(_method)) {
      for (i = 0; arg = _args[i]; i += 1) {
        if (typeof arg === 'function') {
          args.push((function (_handler) {
            return function () { return _handler.apply(_scope, arguments); };
          }(arg)));
        } else {
          args.push(arg);
        }
      }

      return args;
    }

    return _args;
  }

  function registerHandler(_definition) {
    if (!this.hasOwnProperty('eventRegistry')) {
      if (this.eventRegistry && this.isMemberSafe('eventRegistry')) {
        this.eventRegistry = this.eventRegistry.slice(0);
      } else {
        this.eventRegistry = [];
      }
    }

    this.eventRegistry.push(_definition);

    return true;
  }

  // We don't want jQuery methods overridding our base type's methods.
  exclude = ['constructor'].concat(Object.keys(Basic));

  this.baseType = 'TYPE_JQPROXY';
  this.$els = null;
  this.eventRegistry = null;

  for (method in $.fn) {
    if (!$.fn.hasOwnProperty(method) || ~exclude.indexOf(method)) continue;
    this[method] = createProxyFunction(method);
  }

  this.node = function () {
    return this.$els[0];
  };

  this.attachEvents = function () {
    //MPR, ll-trace 33: This is the function that should be extended by scope's attachEvents
    var self;

    self = this;

    if (this.eventRegistry && this.isMemberSafe('eventRegistry')) {
      this.eventRegistry.forEach(function (_definition) {
        self.on.apply(self, _definition);
      });
    }
  };

  this.listen = function (_name, _isCapure_handler, _handler) {
    var _isCapture, node, handler;

    _isCapture = false;

    // resolve arguments
    (typeof _isCapure_handler === 'boolean') ?
      _isCapture = _isCapure_handler :
      _handler = _isCapure_handler;

    _handler.cb = _handler.bind(this);

    if (this.$els) {
      node = this.$els[0];
      if (node) return node.addEventListener(_name, _handler.cb, _isCapture);
    }

    else {
      return registerHandler([_name, _handler.cb, _isCapture]);
    }

    return false;
  };

  this.ignore = function (_name, _handler) {
    var node = this.$els && this.$els[0];

    if (node) return node.removeEventListener(_name, _handler.cb || _handler);

    return false;
  };

  // Wraps you function 'this' to the scope.
  //
  // MPR: Oh for the love of god and all that is holy. @TODO change this functions name.
  this.bind = function (_handler) {
    var args;

    args = [].map.call(arguments, function (m) { return m; }).slice(1);

    //MPR: At the very least remove the extra bind in here. Or remove this function entirely and use
    //fn.bind properly.
    return _handler.bind.apply(_handler, [this].concat(args));
  };

  //MPR: The purpose of this function appears to be to get all items based on a selector
  // and then filter them to only nodes that share a scope. I do not know how this functions
  // with the filter bound to whatever "this" happens to be.
  // Oh. Its not fn.bind. Its scope.bind. That name needs to change.
  this.findOwn = function (_selector) {
    return this.find(_selector).filter(this.bind(function (_index, _node) {
      var $node;

      $node = $(_node);

      if ($node.hasClass('pl-scope')) {
        return $node.parent().scope() === this;
      }

      return $node.scope() === this;
    }));
  };

  this.isMemberSafe = function (_name) {
    var owner, elOwner, prototype;

    if (this.hasOwnProperty(_name)) {
      return true;
    } else {
      prototype = Object.getPrototypeOf(this);
      owner = util.getOwner(this, this[_name]);

      if (owner.object.hasOwnProperty('$els') || prototype.hasOwnProperty('$els')) return false;

      //MPR, ll-trace 30: so this method is basically checking if a property exists on an element
      // or in a prototype chain. If it is in the chain or on the element return false, otherwise
      // return true if it is unique to the current level
      // As a side note, the existence of this method is evidence of why prototypes are not
      // used in this fashion
      if (prototype.$els) {
        elOwner = util.getOwner(prototype, prototype.$els);

        if (owner.object.isPrototypeOf(elOwner.object)) {
          return false;
        }
      }

      return true;
    }
  };

  this.is = function (_obj) {
    if (!_obj) return false;
    if (_obj.$els) return this.$els.is(_obj.$els);

    return this.$els.is(_obj);
  };
});

export default jQProxy;
