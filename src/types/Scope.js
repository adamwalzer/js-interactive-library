/**
 * Scopes are packages which contain a reference to a DOM element wrapped in a jQuery object.
 * This enables properties and methods to be in context of the DOM node and its descendants.
 *
 * @module
 * @requires types/jQProxy
 * @requires types/Basic
 * @requires types/Queue
 * @requires play.game
 * @requires util
 * @requires evalAction
 *
 * @exports createEntity
 */
import jQProxy from 'types/jQProxy';
import Basic from 'types/Basic';
import Queue from 'types/Queue';
import { Point } from 'types/Dimensions';
import game from 'play.game';
import util from 'util';
import evalAction from 'evalAction';
import { AudioManager } from 'types/AudioManager';

/**
 * Creates a new Enitiy instance with a context node and implementation.
 * The instance is prototyped from the parent scope.
 *
 * @memberof module:types/Scope~Scope#createEntity
 * @protected
 * @arg {jQuery} _$node - jQuery object with a single node in the collection.
 * @arg {function|object} _implementation - Constructor function or object with the entity behavior.
 * @returns {module:types/Scope~Scope}
 */
function createEntity(_$node, _implementation) {
  var component, prototype, componentRecord, instance;

    //MPR, ll-trace 43: So, it would appear that sometimes, entities are components. Entities
    // also appear to always be scopes as well. From the types/entities description, it would
    // seem that the purpose of entities is to have a scope with visual elements and the
    // ability to respond to "behaviors". Responding to behaviors here is referred to as a
    // "responisbility". If an entity is a component and the passed in implementation function
    // does not match the components implementation, use the components. Otherwise use the
    // passed in one, and add all of the component's implementation properties to the current
    // scope.
    // @TODO All of this scope extension from arbitrary implementation functions is extremelty
    // unsafe, particularly if the extend function is producing new objects. In the one case,
    // we are probably overriding properties blindly, and on the other we are creating many
    // disparate scope objects for a single DOM scope..
  component = _$node.attr('pl-component');
  prototype = this;

  if (component) {
    componentRecord = game.component.get(component);

    if (componentRecord) {
      // If a scope is being defined as an extention of a component before the component scope
      // has been allocated, we construct the component first then pass it as the proto.
      // But we need to make sure we are not allocating the component it self.
      if (componentRecord.implementation !== _implementation) {
        prototype = this.extend(componentRecord.implementation);
      }
    } else {
      throw new Error('No implementation record for the ' + component + 'component.');
    }
  }

  instance = typeof _implementation === 'function' ? prototype.extend(_implementation) : prototype.create();

    //MPR, ll-trace 44: This seems like an important step, as this will then trigger a cascading initialization
    // inside of the component or entity that is being touched.
  return instance.initialize(_$node, component);
}

/**
 * <span class="important">NOTE:</span> This is NOT a constructor. Use `Scope.create()` to get a new instance.
 * @classdesc A package which contains a reference to a DOM node wrapped in a jQuery object. For more information on scopes read [this]{@link module:types/Scope}.
 * @class
 * @extends module:types/jQProxy~jQProxy
 */
var Scope = jQProxy.extend(function () {

  /**
   * Collection of records pairing a node with its action.
   * @memberof module:types/Scope~Scope
   * @static
   * @protected
   * @todo Convert to types/Collection
   */
  var Actionables;

  function attachActionHandler() {
    this.on(pl.EVENT.ACTION, function (_event) {
      //MPR, ll-trace 5.5: Checking what events this responds to.
      //Seems like just click events for the most part? I guess
      //the purpose of this is to allow arbitrary events in the
      //html templates as pl-action attributes
      var target, record;

      target = $(_event.target).closest('[pl-action]')[0];

      if (_event.originalEvent && _event.originalEvent.changedTouches) {
        /**
         * For now, interactions should use the last touch if multiple fingers are captured.
         * @todo Maybe invoke action for each touch.
         */
        _event.touch = _event.originalEvent.changedTouches[_event.originalEvent.changedTouches.length - 1];
      }

      _event.cursor = Point.create().set(new function () {
        if (_event.touch) {
          this.x = _event.touch.clientX;
          this.y = _event.touch.clientY;
        } else {
          this.x = _event.clientX;
          this.y = _event.clientY;
        }
      });

      if (target) {
        record = this.actionables.item(target);

        if (record) {
          _event.targetScope = this;
          this.event = _event;
          evalAction(record.action, this);
          this.event = null;
        }
      }
    });
  }

//  function getRecordBy(_key, _member, _collection) {
//    var i, record;
//
//   if (_collection) {
//     for (i = 0; record = _collection[i]; i += 1) {
//       if (record[_key] === _member) return record;
//     }
//   }
//
//   return null;
// }

// function removeRecord(_record, _collection) {
//   var index;
//
//   index = _collection.indexOf(_record);
//   if (~index) _collection.splice(index, 1);
// }

  function captureDropables(_scope) {
    var collection;

    collection = [];
    //MPR, ll-trace 19: find all "pl-pluck" elements that are a child of anything?
    //ahh that are a child of the provided scope
    _scope.find('> [pl-pluck]').each(function () {
      var name;

      name = $(this).attr('pl-pluck');

      collection.push(this);
      collection[name] = this;
    });

    return collection;
  }

  function pluckAndDrop(_dropables, _template) {
    $(_template).find('[pl-drop]').each(function () {
      var $node, name, dropable;

      $node = $(this);
      name = $node.attr('pl-drop');
      dropable = _dropables[name];

      if (dropable) {
        $node.replaceWith(dropable.children);
      }
    });
  }

  // Protected
  function loadComponentAssets(_name, _callback) {
    var scope, path, totalRequests, transcludeMode, dropables;

    function ready() {
      ready.status += 1;

      //MPR, ll-trace 18: More request counting. @TODO break into promises for failure cases
      if (ready.status === totalRequests) {
        if (_callback) {
          _callback.call(scope, _name);
        }
      }
    }

    totalRequests = 0;
    scope = this;
    //MPR, ll-trace 23: Nope, this is just loading the template from the game
    path = game.config('componentDirectory') + _name + '/';
    //MPR, ll-trace 20: dump all of the "pl-pluck" attribute children of this scope into this dropables dict
    dropables = captureDropables(this);
    //MPR, ll-trace 21: evidently the inclusion of pluck elements indicates a lack of a transclude property
    //lets keep a watch out for that, and @TODO on renaming pluck to something with meaning
    // TRANSCLUDE_PLUCK is a string, also, so unless there are no droppables and no pl-transclude prop
    // transcludeMode will be a string that gets switched on below
    transcludeMode = dropables.length ? this.TRANSCLUDE_PLUCK : this.properties.transclude;
    ready.status = 0;

    //MPR, ll-trace 22: why to we want to do this if we have a transclude mode OR we have no
    //children?
    if (!this.children().length || transcludeMode) {
      totalRequests += 1;
        //MPR, ll-trace 24: Create a virtual div and then load into it, to allow us to
        //manipulate the elements post-parse. Clever.
      $('<div>').load(path + 'template.html', function () {
        var memory;

        memory = [];

        switch (transcludeMode) {
        //MPR, ll-trace 25: Just shove them in
        case scope.TRANSCLUDE_APPEND:
          scope.append(this.children);
          break;

        //MPR: On top. Why doesnt this require a container like the next one?
        case scope.TRANSCLUDE_PREPEND:
          scope.prepend(this.children);
          break;

        //MPR: Got it. The Pluck is essentially allowing a second level of templating
        // within a component. Its like allowing separate Header, Body, and Footer elements
        // to be popped out of a loading template and replaced. Something to note is that
        // any child elements without a pl-pluck attribute matching a template section
        // will be lost. This may not be a bad thing.
        case scope.TRANSCLUDE_PLUCK:
          pluckAndDrop(dropables, this);
          scope.empty().append(this.children);
          break;

        //MPR: Replace em. Not sure why we would ever want to do this, though
        case scope.TRANSCLUDE_REPLACE:
          scope.empty().append(this.children);
          break;

        default:
          //MPR: The else case here is extranneous. @TODO this default can also be refactored such that the other
          // TRANSCLUDE_PLUCK can be removed.
          if (transcludeMode) {
              pluckAndDrop(new (function () {
                this[transcludeMode] = scope.node();
              }), this);
              scope.empty().append(this.children);
            } else {
              scope.empty().append(this.children);
            }

        }

        //MPR, ll-trace 26: Load every item in this scope labeled pl-component and then fire ready
        // To up the ready count. We may have a problem lazy loading here if we defer firing ready
        // until all screen components are loaded.
        scope.findOwn('[pl-component]').each(function () {
          var name;

          name = $(this).attr('pl-component');

          if (~memory.indexOf(name)) return;

          memory.push(name);

          totalRequests += 1;

          //MPR, ll-trace 28: Recur!
          game.component.load(name, function () {
            //@TODO: MPR, 4/27/16: give this local ready a different name, this is confusing
            ready();
          });
        });
        ready();
      });
    }

    if (!$('style[pl-for-component="' + _name + '"]').length && game.config('shouldLoadComponentStyles') !== false) {
      totalRequests += 1;
      $('<style type="text/css" pl-for-component="' + _name + '">')
        .load(path + 'style.css', ready)
        .appendTo(document.body);
    }

    if (!totalRequests) _callback && _callback.call(this, _name);

    return this;
  }

  function captureProperties() {
    var i, attr, name, collection;

    //MPR, ll-trace 13: Create an array with an extra "has" wrapper method for indexOf
    collection = (function () {

      this.has = function (_name) {
        return !!~this.indexOf(_name);
      };

      return this;

    }).call([]);

    //MPR, ll-trace 15: attach all of the pl- prefixed properties on the game to... the game scope?
    // Unclear use of this. Assuming that this method is bound?
    for (i = 0; attr = this.$els[0].attributes[i]; i += 1) {
      // I explicitly want it to be at the beginning.
      if (attr.name.indexOf('pl-') === 0) {
        name = attr.name.slice(3);
        //MPR, ll-trace 14: transformId has the same functionality as _.toCamelCase, @TODO replace it.
        collection[util.transformId(name, true)] = attr.value;

        collection.push(name);
      }
    }

    //MPR, ll-trace 15.5: this is where they actually get attached
    if (collection.length) this.properties = collection;

    return this;
  }

  function initializeEntities() {
    //MPR, ll-trace 41: It is not clear to me what "entities" are, or how the entities property will ultimately
    // be set. A simple grep indicates it is set frequently in this file. Let us see where.
    // They are set in the "ready" event for the scope, and appear to be the general set of immediate child scopes
    // to the current scope. It is not clear why one would set them using the scope.entity method rather than
    // using a pl-scope attribute.
    if (!this.hasOwnProperty('entities')) return this;

    this.entities.forEach(this.bind(function (_record, _index) {
      var $nodes, query, index;

      $nodes = this.findOwn(_record.selector);
      query = ['#' + _record.selector, '[pl-id=' + _record.selector + ']', '[pl-component=' + _record.selector + ']', '[pl-' + _record.selector + ']'];
      index = 0;

      while (!$nodes.length) {
        if (index === query.length) {
          throw new Error('Unable to locate entity with selector', _record.selector);
        }
        $nodes = this.findOwn(query[index]);
        index += 1;
      }

      $nodes.each(this.bind(function (_index, _node) {
        var $node, instance, id;

        $node = $(_node);

        //MPR, ll-trace 42: So, for each child of the given scope, get all of _that_ scope's children
        // matching a provided selector and see if they prototypically inherit from the given scope
        // if not, create a new instance of entity, binding the create entity to the given scope, and passing
        // the child scope the entity belongs to, and the provided entity implementation, and queue it to load
        // its assets if it is not already ready. Otherwise, the entity has already been initialized somehow,
        // so just store its reference.
        if (!Scope.isPrototypeOf(_record)) {
          instance = createEntity.call(this, $node, _record.implementation);
          if (!instance.isReady) this.assetQueue.add(instance);
        } else {
          instance = _record;
        }

        id = util.transformId(instance.id(), true);
        //MPR, ll-trace 45: More scope property danger. Once we have created an instance, we
        // then add a reference to that entity scope by name with no namespace on the parent scope
        // I have to assume that these are never used, and this is being done for debugging
        // convienience, because to get one back out one would need to first obtain its transformed
        // name from within child scopes somehow, and then dynamically reference it.
        if (id) util.assignRef(this, id, instance);
      }));
    }));

    return this;
  }

  function handleProperties() {
    var scope, property, handler;

    scope = this;

    //MPR, ll-trace 47: So, if we have any additional pl-properties set on our scope object
    // check if we have a "propertyHandler" set for it, and call it.
    // This seems sensible enough, except that these aren't "handlers", but fine
    // The issue is that then, below, we go over each handler and check to see if there are
    // any matching properties inside of our scope, and then we fire each handler again for
    // each one. This seems extremely likely to fire each handler a whole bunch of times.
    // Lastly, at this stage we haven't seen where these get set yet.
    if (this.hasOwnProperty('properties')) {
      this.properties.forEach(function (_name) {
        handler = scope.propertyHandlers[_name];
        if (handler) handler.call(scope, scope.$els[0], _name, scope.properties[_name]);
      });
    }

    if (this.propertyHandlers) {
      for (property in this.propertyHandlers) {
        // Only exclide members on the base type.
        if (Basic.hasOwnProperty(property)) continue;

        handler = this.propertyHandlers[property];

        this.findOwn('[pl-' + property + ']').each(function () {
          var attr;

          if (scope === $(this).scope()) {
            attr = this.attributes.getNamedItem('pl-' + property);

            //MPR: because of the default 'component' handler, this may be picking up the slack
            // on initializing some child component entities. Something to watch for while 
            // attempting to lazt load.
            if (handler) handler.call(scope, this, property, attr.value);
          }
        });
      }
    }

    return this;
  }

  function invokeLocal(_name) {
    var args, owner;

    args = [].slice.call(arguments, 1);

    if (this.isMemberSafe(_name)) {
      return this[_name].apply(this, arguments);
    }
  }

  function init() {
    //MPR, ll-trace 29: Will fire once all pl-components are loaded. Watch out here for getting
    // stuck after lazy loads, or for anything that might get missed were this to only run once
    var willInitEvent, initEvent;

    initEvent = $.Event('initialize', { targetScope: this });
    willInitEvent = $.Event('will-initialize', { targetScope: this });

    //MPR, ll-trace 31: Why aught we only invoke this if the method is local to this scope?
    // That seems arbitrary to me.
    invokeLocal.call(this, 'willInit');
    //MPR: Moreso, if we are checking if our game has attached any such method to the scope,
    // why bother firing the event. A quick grep indicates nothing is listening to willInit
    // @TODO really should be one or the other. The event seems much more sensible.
    this.trigger(willInitEvent);

    //MPR: why hello there.
    this.attachEvents();

    //MPR, ll-trace 46: Finds all of the "entities" of the current scope and creates and initializes
    // them, attaching them as properties to the current scope, based on the selector that was used
    // to find their DOM nodes
    initializeEntities.call(this);
    //MPR, ll-trace 50: Goes through and calls the "handlers" for all of the entities of the given scope
    // including those for all present children's properties for which there are matching named handlers
    // on the scope's propertyHandler property dictionary
    handleProperties.call(this);

    //MPR, ll-trace 51: sets a loading event one each image in the current scope
    this.watchAssets();
    this.captureAudioAssets();
    this.captureReferences();

    this.__init();
    invokeLocal.call(this, 'init');

    this.trigger(initEvent);

    if (!this.isReady) this.assetQueue.ready();

    return this;
  }

  function ready() {
    //MPR, ll-trace 35: this will fire once all assets are loaded, from inside the attachEvents method in this file
    var readyEvent, entities;

    readyEvent = $.Event('ready', { targetScope: this });
    entities = this.findOwn('.pl-scope').scope();

    if (entities) {
      this.entities = [].concat(entities);
    }

    /**
     * Sort audio into DOM order.
     * @todo Consider including this into `AudioManager`. Micah: 2/23/2016.
     */
    // @TODO MPR 4/27/16: Look into why Micah wanted this in dom order. I am concerned
    // that they are simply being invoked in order.
    if (this.hasOwnProperty('audio')) {
      (this.game || this).media.addShadow(this.audio);
      this.audio.collections().forEach(function (_collection) {
        var map = {
          voiceOver: 'voice-over',
          background: 'background',
          sfx: 'sfx'
        };

        if (!_collection.length) return;

        //MPR, ll-trace 37: This is almost certainly the reason that there are problems 
        // attaching audio during a lazy load. Because this only fires on ready, we miss
        // attaching the events in the right order. Either this strategy needs to be re-
        // thought, or this needs to be fully rebuilt and tracked each time a screen
        // is loaded. Adam's idea to create a "screen" audio context instead of just
        // a global one is a good idea and may also mitigate this issue.
        // MPR: Note - the trace should continue here tomorrow. Once this ready is complete
        // the attachEvents method should finish from whatever event fired it in trace
        // step 34, and then control will return to this.init after that event is registered.
        this.findOwn('audio.' + map[_collection.type]).each(function (_index, _node) {
          var id, audio, collection, index;

          id = $(_node).id();
          audio = (_collection.find('#' + id) || [])[0];
          index = _collection.indexOf(audio);

          if (index !== _index) {
            _collection[index] = _collection[_index];
            _collection[_index] = audio;
          }
        });
      }.bind(this));
    }

    this.isReady = true;
    this.addClass('READY');

    this.__ready();
    //@TODO MPR: We really need to clean up this dual scope method / event invocation pattern
    invokeLocal.call(this, 'ready');

    //MPR, ll-trace 36: The ready event is consumed in many places. In the framework, it is consumed in
    // components/carousel/behavior.js:82:      this.on('ready', this.beginShow);
    // source/types/Scope.js:646:    this.on('ready', function (_event) {
    // source/types/Scope.js:877:        $node.on('ready', this.bind(function (_event) { 
    // and is additionally triggered in
    // source/play.game.js:45:  game.trigger(_eventName || 'ready');
    // source/types/AudioManager.js:423:    readyEvent = $$.Event('ready', {targetScope: this});
    // lastly, it is disabled later in this file at
    // source/types/Scope.js:651:      if (!this.assetQueue.length && this.isReady) this.off('ready');
    this.trigger(readyEvent);
  }

  Actionables = (function () {

    util.mixin(this, Basic);

    this.add = function (_node, _action) {
      if (!this.has(_node)) {
        this.push({
          node: _node,
          action: _action
        });
      }

      return this;
    };

    this.remove = function (_node) {
      var item, index;

      item = this.item(_node);
      index = this.indexOf(item);
      if (~index) this.splice(index, 1);

      return this;
    };

    this.item = function (_node) {
      var i, item;

      for (i = 0; item = this[i]; i += 1) {
        if (item.node === _node) return item;
      }
    };

    this.has = function (_node) {
      return !!this.item(_node);
    };

    return this;

  }).call([]);

  this.TRANSCLUDE_REPLACE = 'replace';
  this.TRANSCLUDE_PREPEND = 'prepend';
  this.TRANSCLUDE_APPEND = 'append';
  this.TRANSCLUDE_PLUCK = 'pluck';

  this.baseType = 'TYPE_SCOPE';
  this.actionables = null;
  this.isReady = null;
  this.isComponent = false;
  this.entities = null;
  this.audio = null;
  this.properties = null;
  this.propertyHandlers = null;
  this.assetQueue = null;
  this.event = null;
  this.currentMedia = {};

  this.initialize = function (_node_selector, _componentName) {
    var doInitialize = function (_node_selector, _componentName) {
        var scope;

        scope = this;

        this.isReady = false;
        this.isComponent = !!_componentName;
        this.event = null;
        this.assetQueue = Queue.create();
        //MPR, ll-trace 11: this will be a reference to the game wrapper,
        this.$els = (_node_selector.jquery) ? _node_selector : $(_node_selector);

        if (!this.$els.length) {
          throw new ReferenceError('Unable to locate the element with selector ' + this.$els.selector + '.');
        }

        this.addClass('pl-scope ' + (_componentName ? _componentName + '-component' : ''));
        //MPR, ll-trace 12: probably shouldnt be storing all this data in the DOM but here we are
        this.data('pl-scope', this);
        this.data('pl-isComponent', !!_componentName);

        //MPR, ll-trace 16: after this point, all of the pl- attributes on the game will be located in
        //the 'properties' property of the scope, which will be the Game global scope when this is called
        //from "run"
        captureProperties.call(this);

        if (_componentName) {
        //MPR, ll-trace 17: This is probably where we load up the library components
          loadComponentAssets.call(this, _componentName, function () {
            init.call(this);
          });
        } else {
          init.call(this);
        }

        return this;
    }.bind(this, _node_selector, _componentName);

    if (_componentName === 'screen-basic') {
      window.magic = window.magic || {};
      window.magic[_node_selector.id()] = doInitialize;
      window.magic._screenOrder = window.magic._screenOrder || [];
      window.magic._screenOrder.push(doInitialize);
      //if(window.magic._screenOrder.length < 2) {
      //  return doInitialize();
     // }
    } else {
      //  return doInitialize();
    }
    //return this;
        return doInitialize();
  };

  // only for use in base types
  this.__init = function () { return this; };
  this.__ready = function () { return this; };

  this.willInit = function () { return this; };
  this.init = function () { return this; };
  this.ready = function () { return this; };

  this.watchAssets = function (_nodes) {
    var createHandler, watch;

    createHandler = this.bind(function (_node) {
      return (function () {
        var loadedEvent = $.Event('loaded', { targetScope: this });

        this.assetQueue.ready(_node.src);
        this.trigger(loadedEvent, [_node]);

        _node.onload = null;
      }).bind(this);
    });

    watch = this.bind(function (_index, _node) {
      var node = typeof _index === 'number' ? _node : _index;

      if (node.nodeName !== 'IMG' || node.complete) return;
      if (this.assetQueue.add(node.src)) {
        node.onload = createHandler(node);
        node.onerror = function () {
          console.error('Image failed to load', node.src);
        };
      }
    });

    if (_nodes) {
      _nodes.forEach(watch);
      return this;
    }

    //MPR: So evidently were watching each child but ignoring them if they arenet images
    // then getting all of our children who are images and running over them again? I have
    // to see if everything still works without this first line.
    // oh we totally can.
    this.each(watch);
    this.findOwn('img').each(watch);

    return this;
  };

  this.attachEvents = function () {

    //MPR, ll-trace 32: Another area to be careful. I will make a note of which function this
    // proto intends to invoke when using fn.caller so that we can do so correctly once it is
    // removed.
    // The correct method is the highest level parent:
    // source/types/jQProxy.js:98:  this.attachEvents = function () {
    this.proto();

    //MPR, ll-trace 34: This is triggered in types/queue (currently on line 19) and is also listened several times in
    // types/entity
    this.assetQueue.on('complete', this.bind(function () {
      this.assetQueue.off();
      //MPR: that was a wild ride from start to finish.
      // @TODO Clean up this event structure.
      ready.call(this);
    }));

    //MPR, ll-trace 38: This is triggered by the ready call in the above assetQueue.on('complete')
    this.on('ready', function (_event) {
      //MPR: only fire assetQueue ready if this ready event was issued for both the current and asset scopes?
      if (this.has(_event.targetScope) && this.assetQueue.has(_event.targetScope)) {
        this.assetQueue.ready(_event.targetScope);
      }

      //MPR, ll-trace 40: Given that this event will only be triggered when all assets have loaded
      // it is unclear to me what the purpose of this is. This event is fired very frequently however,
      // and upon inspection this.isReady is generally false. It must be that many events trigger ready
      // but only the trace leading here in code produces the final result. Additionally, this result
      // seems totally independent of the above assetQueue contitional, which additionally does not
      // seem to affect assetQueue.length
      if (!this.assetQueue.length && this.isReady) this.off('ready');
    });

    return this;
  };

  this.captureReferences = function () {
    this.findOwn('[id], [pl-id]').each(this.bind(function (_index, _node) {
      var $node, id;

      if (_node.nodeName === 'AUDIO') return;

      $node = $(_node);
      id = $node.attr('id') || $node.attr('pl-id');

      if (!this[id]) {
        util.assignRef(this, id, $node.data('pl-scope') || $node);
      }
    }));
  };

  this.captureAudioAssets = function () {
    var deQ, $audio;

    if (!($audio = this.findOwn('audio')).length) return false;

    deQ = function (_item) {
      [this, this.screen].forEach(function (_scope) {
        if (_scope.requiredQueue && _scope.isMemberSafe('requiredQueue') && _scope.requiredQueue.has(_item)) {
          _scope.requiredQueue.ready(_item);
        }
      });
    }.bind(this);

    this.audio = AudioManager.create(this.id());

    $audio.each(function (_index, _node) {
      this.assetQueue.add(_node.src);
      this.audio.watch(_node).then(function (_audio) {
        var loadedEvent = $.Event('loaded', { target: _node, targetScope: this });

        if ($(_node).is('[pl-required]')) this.screen.require(_audio);

        if (this.assetQueue.has(_node.src)) this.assetQueue.ready(_node.src);

        this.trigger(loadedEvent);
      }.bind(this));
    }.bind(this));

    // proxy events
    this.audio.on('play pause ended stopped', this.bind(function (_event) {
      var map = {
        background: 'BACKGROUND',
        voiceOver: 'VOICE-OVER',
        sfx: 'SFX'
      };

      switch (_event.type) {
      case 'play':
        [this, this.screen].forEach(function (_scope, _index, _set) {
            if (_index === 1 && _scope === _set[0]) return;
            if (_scope.$els) {
              _scope.addClass('PLAYING '+map[_event.target.type]);
              _scope.currentMedia[map[_event.target.type]] = _event.target;
            }
          });

        $(_event.targetNode).addClass('PLAYING');
        break;

      case 'pause':
      case 'stopped':
      case 'ended':
        [this, this.screen].forEach(function (_scope, _index, _set) {
            var state;

            if (_index === 1 && _scope === _set[0]) return;

            if (_scope.$els) {
              _scope.removeClass(map[_event.target.type]);
              state = _scope.attr('class');
              if (!(/BACKGROUND|VOICE-OVER|SFX/).test(state)) _scope.removeClass('PLAYING');
              if(_scope.currentMedia[map[_event.target.type]] === _event.target) _scope.currentMedia[map[_event.target.type]] = null;
            }
          });

        $(_event.targetNode).removeClass('PLAYING');
        if (_event.type === 'ended') deQ(_event.target);
        break;
      }

      var audioEvent = $.Event('audio-' + _event.type, {
        target: _event.target,
        targetSource: _event.targetSource,
        targetNode: _event.targetNode,
        targetScope: this
      });

      this.trigger(audioEvent);
    }));

    return this;
  };

    //MPR, ll-trace 48: What the fuck
  this.handleProperty = function (_implementation) {
    if (this.propertyHandlers) {
      if (this.hasOwnProperty('propertyHandlers')) {
        switch (typeof _implementation) {
        case 'function':
          _implementation.call(this.propertyHandlers);
          break;

        case 'object':
          this.propertyHandlers.mixin(_implementation);
          break;
        }
      } else {
        this.propertyHandlers = this.propertyHandlers.extend(_implementation);
      }
    } else {
      this.propertyHandlers = Basic.extend(_implementation);
    }

    return this;
  };

  //MPR: only called from components. Seems to be used to attach "entities" to scopes. 
  // The entity itself is a jquery selector with a "implementation" function, similar to
  // the way games and components are initialized. It is unclear why entities are distinct
  // from these other types.
  this.entity = function (_selector, _implementation) {
    var Entity, prototype, id;

    Entity = game.provideEntityType();

    if (!this.hasOwnProperty('entities')) this.entities = [];

    if (this.hasOwnProperty('$els')) {
      throw new Error('Wait this hasn\'t been tested.');
      prototype = (Entity.isPrototypeOf(this)) ? this : Entity;
      instance = prototype.extend(_implementation).initialize(this.find(_selector));
      id = util.transformId(instance.id());

      // this.entities.push(instance);
      if (id) this[id] = instance;
    } else {
      this.entities.push({
        selector: _selector,
        implementation: _implementation
      });
    }

    return this;
  };

  this.has = function (_child) {
    var child;

    child = Scope.isPrototypeOf(_child) ? _child.$els : _child;

    return !!this.$els.has(child).length;
  };

  this.toString = function () {
    var type;

    type = this.baseType.replace('TYPE_', '');
    type = type.slice(0, 1) + type.slice(1).toLowerCase();

    return ['[', this.id() || this.address(), ' ', type, ']'].join('');
  };

  this.log = function () {
    var args;

    args = util.toArray(arguments);

    console.log.apply(console, [this.id() || this.address(), '-'].concat(args));
    return this;
  };

    //MPR, ll-trace 49: So each scope will attach either an object containing a demi-constructor
    // or a flat object that accomplishes the same thing. All of this appears to be done to avoid
    // needing to have a separate function to invoke the handlers from the one that sets them. In
    // theory this could be used to avoid overriding methods, but this doesnt do that. It will
    // simply overwrite any that happen to be there in a variety of ways.
    // By default, the global scope will respond to the 4 properties defined here: component, action, required, and require
    // component appears to try to recreate the component entity, which should also have happened in initializeEntities.
  this.handleProperty(function () {

    this.component = function (_node, _name, _value, _property) {
      var $node, record, scope, id;

      $node = $(_node);

      if (!$node.data('pl-isComponent')) {
        record = game.component.get(_value);

        if (record) {
          scope = createEntity.call(this, $node, record.implementation);
          id = util.transformId(scope.id() || _value, true);
          util.assignRef(this, id, scope);

          if (!scope.isReady) this.assetQueue.add(scope);
        } else {
          throw new Error('Ahh!');
        }
      }
    };

    this.action = function (_node, _name, _value) {
      if (!this.hasOwnProperty('actionables')) {
        this.actionables = Actionables.create();
        attachActionHandler.call(this);
      }

      this.actionables.add(_node, _value);
    };

    this.required = function (_node, _name, _value) {
      if (this.is(_node)) {
        this.screen.require(this);
      }
    };

    this.require = function (_node, _name, _value) {
      var query, $node;

      // if the node with the attribute is the node for this scope
      if (this.is(_node)) {
        query = '#_value, [pl-id=_value], [pl-component=_value]'.replace(/_value/g, _value);
        $node = this.find(query);

        $node.on('ready', this.bind(function (_event) {
          if ($node.is(_event.target)) {
            this.require(_event.targetScope);
          }
        }));
      }
    };

  });

});

export default { Scope, createEntity };
