/**
 * Defines the 'game' method for registration and initialization of game scopes. This method also acts as a namespace for game level functions (See: [pl.game]{@link module:play~pl.game}).
 *
 * @module game
 * @author Micah Rolon <micah@ginasink.com>
 *
 * @requires play.game.component
 * @requires play.game.manager
 * @requires util
 * @requires types/Events
 * @requires types/GlobalScope
 * @requires types/Entity
 * @requires types/Screen
 * @requires types/Game
 */
import component from 'play.game.component';
import manager from 'play.game.manager';
import util from 'util';
import Events from 'types/Events';
import { default as SCOPE } from 'types/GlobalScope';
import Entity from 'types/Entity';
import Screen from 'types/Screen';
import Game from 'types/Game';
import platform from 'platform';

var GAMES, CONFIG, READY_QUEUE;

/**
 * Define a game scope for registration and/or initialization.
 * This method also acts as a namespace for game level functions (See: [pl.game]{@link module:play~pl.game}).
 *
 * @arg {string} _name - The name of the game matched with a DOM nodes 'id' attribute.
 * @arg {function|object} _implementation - The constructor or object which implements the scope behavior.
 */
function game(_name, _implementation) {
  if (game.isDOMReady) {
    initialize(_name, _implementation);
  } else {
    register(_name, _implementation);
  }
}

function ready(_eventName) {
  if (READY_QUEUE.length) return false;
  game.trigger(_eventName || 'ready');
}

/**
 * Registers an implementation of a game scope for initialization.
 * @protected
 * @arg {string} _name - The name of the game matched with a DOM nodes 'id' attribute.
 * @arg {function|object} _implementation - The constructor or object which implements the scope behavior.
 */
function register(_name, _implementation) {
  if (!~GAMES.indexOf(_name)) {
    GAMES.push({
      id: _name,
      implementation: _implementation
    });
  }
}

/**
 * Initializes an implementation of a game scope. (overloaded)
 * @function initialize
 * @protected
 * @arg {string} _name - The name of the game matched with a DOM nodes 'id' attribute.
 * @arg {function|object} _implementation - The constructor or object which implements the scope behavior.
 */

/**
 * Initializes an implementation of a game scope.
 * @protected
 * @arg {array} _collection - The collection of game scope records for initialization.
 * @arg {function|object} _implementation - The constructor or object which implements the scope behavior.
 */
function initialize(nameCollection, implementation) {
  switch (typeof nameCollection) {
  case 'string':
    SCOPE[nameCollection] = Game
        //MPR, ll-trace 8: Now, this is where things start to get interesting
        //This "Game" object comes from types/Game, which itself is an alias for
        // types/GlobalScope, which is an alias for types/Scope, which is a singleton
        // instance of the jqProxy type. This type inverts a number of jQuery methods
        // (notably 'extend') to operate on the invoked 'this' object, rather than
        // taking that object as the first parameter. As such, this will add all of the
        // properties from the current game's "implementation" function onto the global
        // "Game" scope object. Note that these are different from the pl.game object
        // which is being constructed by this module. That function is used to pass
        // the implementation function in from the games themselves.
        .extend(implementation)
        //MPR, ll-trace 10: because this is an instance of types/scope, we get the initialize
        //method from there.
        .initialize('#' + nameCollection);
    break;

  case 'object':
    //MPR, ll-trace 7: This case is soley for convienience. It simply reinvokes itself
    //to match the string case.
    nameCollection.forEach(function (_item) {
      initialize(_item.id, _item.implementation);
    });
    break;
  }
}

function initializeSingleScreen(node, componentType) {
  //Game.initialize(node, componentType);
}

/** @protected */
GAMES = [];
/** @protected */
CONFIG = {};
/** @protected */
READY_QUEUE = [];

/**
 * Interface for game level configuration.
 * @namespace game
 * @memberof module:play~pl
 * @mixes Events
 */
(function () {

  var audioContext;

  this.component = component;
  this.manager = manager;

  util.mixin(game, Events);

  this.on('platform-event', function (_event) {
    console.log('play.game -', _event.name, _event.gameData); //eslint-disable-line no-console
  });

  /**
   * Starts the dominos falling
   * @function run
   * @memberof module:play~pl.game
   */
  this.run = function () {
    game.isDOMReady = true;
    game.trigger('dom-ready');

    game.component.loadAll(function () {
      // console.log('** All component sources loaded.');
      //MPR, ll-trace 6: does this really fire once for each component?
      //yep.
      //Note that this games array generally contains a dict containing a single registered game object
      //Not sure why one would ever need more than one, but there we are.
      initialize(GAMES);

      GAMES = null;
    });

    platform.emit(platform.EVENT_INIT);
  };

  this.report = function (_name) {
    platform.emit(_name);

    return this.report;
  };

  this.report.exit = function (_gameScope) {
    platform.saveGameState(_gameScope.progress());
    platform.emit(platform.EVENT_EXIT);

    return this;
  };

  this.report.flip = function (_gameScope, data = {}) {
    if (_gameScope.game) {
      _gameScope = _gameScope.game;
    }
    platform.emit(platform.EVENT_FLIPPED, data);
    platform.saveGameState(_gameScope.progress());

    return this;
  };


  /**
   * Getter/Setter for game level configuration.
   * @function module:play~pl.game.config
   * @arg {string} _key - The key to retrieve
   * @returns {this}
   */

  /**
   * Getter/Setter for game level configuration.
   * @function config
   * @memberof module:play~pl.game
   * @arg {object} _mixin - Object to set properties on configuration.
   * @returns {this}
   */
  this.config = function (keyMixin) {
    switch (typeof keyMixin) {
    case 'string': return util.resolvePath(CONFIG, keyMixin);
    case 'object':
      if (keyMixin) util.mixin(CONFIG, keyMixin);
    }

    return this;
  };

  /**
   * @function provideEntityType
   * @deprecated
   * @memberof module:play~pl.game
   */
  this.provideEntityType = function () {
    return Entity;
  };

  /**
   * @function provideScreenType
   * @deprecated
   * @memberof module:play~pl.game
   */
  this.provideScreenType = function () {
    return Screen;
  };

  /**
   * Augments the global scope.
   * @function scope
   * @arg {function|object} _mixin - Object or constructor to define members.
   * @returns {this}
   *
   * @memberof module:play~pl.game
   */
  this.scope = function (_mixin) {
    if (typeof _mixin === 'function') {
      _mixin.call(SCOPE);
    } else if (_mixin) {
      SCOPE.mixin(_mixin);
    }

    return this;
  };

  /**
   * @function queue
   * @deprecated
   * @memberof module:play~pl.game
   */
  this.queue = function (_item) {
    if (!~READY_QUEUE.indexOf(_item)) READY_QUEUE.push(_item);

    return this;
  };

  this.queue.complete = function (_item, _eventName) {
    var index;

    index = READY_QUEUE.indexOf(_item);
    READY_QUEUE.splice(index, 1);

    ready(_eventName);

    return this;
  };

  /**
   * Accessor for the detected features supported by the browser.
   *
   * *Supported Feature Detectors*
   * - touch
   *
   * @function feature;
   * @arg {string} _name - The feature which to test for (i.e. `"touch"`)
   * @returns {boolean} The support status for the specified feature.
   */
  this.feature = (function () {
    var detect = {
      touch: function () {
        return window.hasOwnProperty('ontouchend');
      }
    };

    return function (_name) {
      var tester = detect[_name];
      if (!tester && console) console.warn('No feature detection for "' + _name + '".'); //eslint-disable-line no-console
      return tester && tester();
    };
  }());

  this.getAudioContext = function () {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext);
      window.onfocus = function () {
        audioContext.resume();
      };
      window.onblur = function () {
        audioContext.suspend();
      };
    }
    return audioContext;
  };

  this.enableAudioContext = function () {
    var ctx, silence;

    ctx = this.getAudioContext();
    silence = ctx.createBufferSource();

    silence.buffer = ctx.createBuffer(2, 1, 44100);
    silence.connect(ctx.destination);
    silence.start();
    silence.disconnect();

    return silence;
  };

  this.initialize = initialize;
  this.initializeScreen = initializeSingleScreen;
}).call(game);

export default game;
