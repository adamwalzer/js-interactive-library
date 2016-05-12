/**
 * Defines the `component()` method for component behavior registration. This method is also a namesapce for methods to manage and load component behavior scripts.
 *
 * @module
 * @author Micah Rolon <micah@ginasink.com>
 *
 * @requires play~pl.util
 * @requires types/Events
 */
import util from 'util';
import Events from 'types/Events';

/**
 * Collection of component behavior records
 * @const
 */
var COMPONENTS;

/**
 * Registers a component behavior.
 * @arg {string} _name - The name for the component.
 * @arg {function|object} _implementation - Constructor function or object with the behavior's implementation.
 * @returns {@link module:play~pl.game}
 */
function component(_name, _implementation) {
  if (!component.get(_name)) {
    COMPONENTS.push({
      name: _name,
      implementation: _implementation,
      config: {}
    });
  }

  return this;
}

COMPONENTS = [];

/**
 * Methods to manage and load component behavior scripts.
 * @namespace component
 * @memberof module:play~pl.game
 * @mixes Events
 */
(function () {

  util.mixin(this, Events);

  /**
   * Given a name; provides the component record. `{name, implementation}`
   * @memberof module:play~pl.game.component
   * @arg {string} _name - The name of the component.
   * @returns {object} The record.
   */
  this.get = function (_name) {
    var i, record;

    for (i = 0; record = COMPONENTS[i]; i += 1) {
      if (record.name === _name) return record;
    }

    return null;
  };

  /**
   * Loads the script for the component. The HTML and CSS will be loaded when the component scope initalizes.<br>
   * The path of the script file is resolved `{pl.game.config.componentDirectory}/{_name}/behavior.js`.
   * @memberof module:play~pl.game.component
   * @arg {string} _name - The name of the component.
   * @arg {function} _callback - Callback for load success.
   * @todo Implement Promises.
   * @returns `this`
   */
  this.load = function (_name, _callback) {
    var path;

    //MPR, ll-trace 27: Back here. This is our recursive loop - Load all pulls the top level
    // game components (including screens), which then in turn load their own. We _should_ now
    // have loaded all of component templates and behaviors. Everything after this point
    // should be unrelated to directly loading - hopefully events and audio attachment
    if (component.get(_name)) {
      if (_callback) _callback.call(component, _name);
      return null;
    }
    //MPR, ll-trace 4: Here we load the behavior component from the game, not from the library
    //It seems likely that the games will invoke the default library behavior either themselves,
    //or it will somehow be done automatically for them.
    path = pl.game.config('componentDirectory') + _name + '/behavior.js';

    $.getScript(path, function () {
      if (_callback) _callback.call(component, _name);
      //MPR, ll-trace 5: Fires the loaded event. Does not appear to be listened to anywhere explicitly
      //however there are a few dynamic bindings that may fire. These are:
      //source/types/Game.js:427:      this.on(pl.EVENT.ACTION, function beginAudio(_event) {
      //source/types/Scope.js:80:    this.on(pl.EVENT.ACTION, function (_event) {
      //Checking those now.
      //These do not seem to ever respond on 'loaded'
      component.trigger('loaded', [_name]);
    });

    return this;
  };

  /**
   * Loads all the component scripts for HTML elements with `pl-component` attributes.
   * @memberof module:play~pl.game.component
   * @arg {function} _callback - Callback for load success.
   * @todo Implement Promises.
   * @returns `this`
   */
  this.loadAll = function (_callback) {
    var $components, queue;

    $components = $('[pl-component]');
    queue = [];

    //MPR, ll-trace 1: here we are collecting all of the
    //types of component. This will load the component
    //type into memory, but not the page components
    //themselves
    $components.each(function (_index) {
      var name;

      name = $(this).attr('pl-component');

      if (~queue.indexOf(name)) return;

      queue.push(name);
    });

    queue.slice(0).forEach(function (_name) {
      //MPR, ll-trace 2: next, get each of the scripts for the component types
      //by name.
      component.load(_name, function () {
        var index;

        index = queue.indexOf(_name);
        queue.splice(index, 1);

        //MPR, ll-trace 3: I wonder if this approach to firing this callback will encounter
        //async problems under certain network conditions. On a timeout, it simply
        //will never fire. @TODO this should become a promise.all.,
        if (!queue.length && _callback) _callback.apply(component, arguments);
      });
    });

    return this;
  };

  // Maybe?
  // this.config = function () {};

}).call(component);

export default component;
