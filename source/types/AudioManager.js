"use strict";
/**
 * Contains classes for managing different media types.
 * Providing an API for referencing and control.
 * @module
 * @author Micah Rolon <micah@ginasink.com>
 */
import type from 'types/type';
import util from 'util';
import Collection from 'types/Collection';

// Object type definitions are using  `$` as the augmentation method for Types.
var EventTargetInterface,
	InspectorInterface,
	PlayableInterface,
	LegislatorInterface,
	StateInterface,
	$$ = window.jQuery;

/**
 * <span class="note important">NOTE: This constructor is used to construct its protoype which we instatiate with `MediaManager.create()`.</span>
 * Manages any playing media (Audio, Video).
 * @arg {function} $ - Passed by `type()`, gives you a pritier interface for defining the instance members.
 * @classdesc Manages any playing media (Audio, Video).
 * <style>
 * .note {
 *   border: solid 1px;
 *   border-radius: 4px;
 *   padding: 1px 4px;
 *   color: #aaa;
 *   background-color: #eee;
 * }
 * 
 * .note.important {
 *   color: #b55;
 *   background-color: #fee;
 * }
 * </style>
 *
 * @class
 */
function MediaManager ($, sup) {
	/**
	 * Duck typed multiple inheritance.
	 */
	util.mixin(this, EventTargetInterface, InspectorInterface, LegislatorInterface, StateInterface);
$(
	'video',

	function alloc (_id) {
		sup(this, 'alloc', arguments);
		this.video = Collection.create();
		this.initialize(_id, 'media manager');
	}
)}

/**
 * The Scopes entry for its audio management interface. This gives access to collections of Audio objects grouped into three types.
 *
 * <span class="note important">NOTE: This constructor is used to construct its protoype which we instatiate with `AudioManager.create()`.</span>
 * @arg {function} $ - Passed by `type()`, gives you a pritier interface for defining the instance members.
 * @classdesc The Scopes entry for its audio management interface. This gives access to collections of Audio objects grouped into three types.
 * - Background
 * - Voice Over
 * - SFX (Sound Effects)
 * These collections are filled by the HTML Audio elements which have classes corresponding to these types.
 * @class
 * @prop {type} member - Text.
 * @extends EventTargetInterface
 * @extends PlayableInterface
 * @extends InspectorInterface
 */
function AudioManager ($) {
	var AUDIO_TYPES, BUFFER_CACHE;

	/**
	 * A record object for passing the MediaElement which got loaded as an `AudioBuffer`.
	 * @arg {HTMLAudioElement} _node - The loaded audio element.
	 * @arg {ArrayBuffer} _buffer - The array buffer loaded from XHR2.
	 */
	function AudioBufferRecord (_node, _buffer) {
		this.node = _node;
		this.type = getAudioType(_node);
		this.buffer = _buffer;
	}
	/**
	 * Provides the classification an audio element falls into.
	 * - Background (`background`)
	 * - Voice Over (`voiceOver`)
	 * - Sound Effects (`sfx`)
	 * @protected
	 * @arg {HTMLAudioElement} _audio - The audio element.
	 * @returns {string} - The type.
	 */
	function getAudioType (_audio) {
		return util.transformId((_audio.className.match(AUDIO_TYPES) || [])[0], true);
	}
	/**
	 * Given an HTMLAudioElement, load its source as an `ArrayBuffer` with XHR2.
	 * @protected
	 * @arg {HTMLAudioElement} _audio - The audio element.
	 * @returns {Promise}
	 */
	function loadArrayBuffer (_audio) {
		var xhr, manager, fileName;

		xhr = new (XMLHttpRequest || util.noop);
		manager = this;
		fileName = util.resolveFileName(_audio.src);

		if (!xhr.open) Promise.reject('This platfom does not support the XMLHttpRequest API.');

		return new Promise(function (resolve, reject) {
			var cache = BUFFER_CACHE[fileName];

			// Decodes ArrayBuffer into an AudioBuffer.
			function onLoad () {
				var ctx, promise;

				if (xhr.status >= 200 && xhr.status < 300) {
					if (ctx = pl.game.getAudioContext()) {
						promise = new Promise(function (resolveDecoding, rejectDecoding) {
							try {
								ctx.decodeAudioData(xhr.response, function (_buffer) {
									var audio = manager.collect( new AudioBufferRecord(_audio, _buffer));

									resolveDecoding(audio);
									// Cache the AudioBuffer to resolve duplicates.
									BUFFER_CACHE[fileName] = _buffer;
								}, function () {
									rejectDecoding("Failed to decode ArrayBuffer for "+fileName+".");
								});	
							} catch (e) {
								rejectDecoding(e);
							}
						});

						promise.then(resolve).catch(reject);

						return promise;
					}
					
				} else {
					reject(xhr.statusText);
				}

				xhr.removeEventListener('load', onLoad);
				xhr = null;
			}

			function onError () {
				reject(xhr.statusText);
				xhr.removeEventListener('error', onError);
				xhr = null;
			}

			if (cache && cache !== 'loading') return resolve( manager.collect( new AudioBufferRecord(_audio, cache)));

			BUFFER_CACHE[fileName] = 'loading';

			xhr.responseType = 'arraybuffer';

			xhr.addEventListener('load', onLoad, false);
			xhr.addEventListener('error', onError, false);
			xhr.open('GET', _audio.src, true);
			xhr.send();
		});
	}
	/**
	 * The CSS class names reconized as audio types.
	 */
	AUDIO_TYPES = /background|voice-over|sfx/i;
	BUFFER_CACHE = {};
	/**
	 * Duck typed multiple inheritance.
	 */
	util.mixin(this, EventTargetInterface, PlayableInterface, InspectorInterface, LegislatorInterface, StateInterface);

// A little ugg but define instance members.
$(
	// Declare properties.
	'background, voiceOver, sfx, scope',

	/**
	 * Define instance properties.
	 */
	function alloc (_id) {
		this.initialize(_id, 'audio manager');

		['background','voiceOver','sfx'].forEach(function (_type) {
			var collection = this[_type] = AudioCollection.create(_type);
			this.addShadow(collection);
		}.bind(this));
	},

	/**
	 * Given an audio element begin loading the asset.
	 * @arg {HTMLAudioElement} _audio - The HTML Audio element which to preload and add to the game audio context.
	 * @returns {Promise}
	 * @todo Support loading from node source or a string argument. - Micah:2/19/16
	 */
	function load (_audio) {
		var manager, type;

		manager = this;
		type = getAudioType(_audio);

		if (!type) return Promise.reject("Audio is missing a type. Please classify as 'background', 'voiceOver' or 'sfx'.");
		if (~['sfx', 'voiceOver'].indexOf(type)) return loadArrayBuffer.call(this, _audio);

		return new Promise(function (resolve, reject) {
			_audio.onloadeddata = function () { resolve(manager.collect(this)); };
			_audio.onerror = reject;
			_audio.load();
		});
	},

	/**
	 * Begins loading an AudioElement waits for it to load.
	 * @arg {HTMLAudioElement} _audio - The HTML Audio element which to preload and add to the game audio context.
	 * @returns {Promise}
	 */
	function watch (_audio) {
		var promise;

		if (_audio.nodeName !== 'AUDIO') return Promise.reject('Invalid type for audio node. '+(typeof _audio)+' ['+_audio.protoype.constructor.name+' '+_audio.nodeName+'].');

		function reject (_error) {
			var scope = $$(_audio).scope();
			console.warn(scope.id(), '-', _error);
		}

		(promise = this.load(_audio)).catch(reject.bind(this));

		return promise;
	},

	/**
	 * Adds a audio to the collection. You may also pass an itterable of items to add.
	 * @arg {Audio|HTMLAudioElement|AudioBufferRecord|Array} _audio - The HTML Audio element or `AudioBufferRecord` for addition to the collection.
	 * @returns {Promise}
	 */
	function collect (_audio) {
		var type;

		if (!_audio) return false;

		if (_audio.length) {
			return _audio.map(collect.bind(this));
		}

		type = _audio.type || getAudioType(_audio);

		if (type && this[type]) return this[type].add(_audio);

		return false;
	},
	/**
	 * Provides a collection of `AudioCollection` objects.
	 * @returns {array}
	 */
	function collections () {
		var result, types;

		result = [];
		types = Object.keys(this);

		types.forEach(function (_type) {
			if (this[_type] instanceof AudioCollection) result.push(this[_type]);
		}.bind(this));

		return result;
	},
	/**
	 * Proveds a string representation of the object type.
	 */
	function toString () {
		return '[object '+(this.constructor.name || 'Object')+']';
	}
)}

/**
 * An itterable with a collection of Audio objects. This interface also exposes methods for working with it members.
 *
 * <span class="note important">NOTE: This constructor is used to construct its protoype which we instatiate with `AudioCollection.create()`.</span>
 * @arg {function} $ - Passed by `type()`, gives you a pritier interface for defining the instance members.
 * @classdesc An itterable with a collection of Audio objects. This interface also exposes methods for working with it members.
 * @extends Collection
 */
function AudioCollection ($, sup) {
	/**
	 * Duck typed multiple inheritance.
	 */
	util.mixin(this, EventTargetInterface, PlayableInterface, InspectorInterface, StateInterface);

$(
	'type',

	function alloc (_type) {
		if (_type) this.type = _type;
		this.initialize(_type, 'collection');
	},
	/**
	 * Adds an Audio object to the collection.
	 * @arg {HTMLAudioElement|Audio} _audio - Object to add.
	 * @override
	 * @returns {Audio}
	 */
	function add (_audio) {
		var audio;

		if (!_audio) return false;
		
		audio = (_audio instanceof Audio) ? _audio : Audio.create(_audio, this.type);

		sup(this, 'add')(audio);
		this.addShadow(audio);
		if (audio.id()) util.assignRef(this, audio.id(), audio);

		return audio;
	},
	/**
	 * Get the owning manager interface for an Audio object.
	 * @returns {AudioManager}
	 */
	function manager () {
		return this.$el.closest('#man').data('context');
	},
	/**
	 * Proveds a string representation of the object type.
	 */
	function toString () {
		return '[object '+(this.constructor.name || 'Object')+']';
	}
)}
/**
 * Extend AudioCollection with Collection.
 */
AudioCollection.prototype = Object.create(Collection, {
	constructor: {
		value: AudioCollection,
		enumerable: false,
		writeable: false,
		configureable: false
	}
});
/**
 * <span class="note important">NOTE: This constructor is used to construct its protoype which we instatiate with `MediaCollection.create()`.</span>
 * Returned as the result of some collection process.
 * @arg {function} $ - Passed by `type()`, gives you a pritier interface for defining the instance members.
 * @classdesc Returned as the result of some collection process.
 *
 * @class
 * @extends AudioCollection
 * @extends EventTargetInterface
 * @extends InspectorInterface
 * @extends LegislatorInterface
 * @extends StateInterface
 */
function MediaCollection ($, sup) {
	/**
	 * Duck typed multiple inheritance.
	 */
	util.mixin(this, InspectorInterface, StateInterface);
$(
	/**
	 * @override
	 */
	function add (_media) {
		this.addShadow(_media);
		if (_media.id()) util.assignRef(this, _media.id(), _media);
		return Collection.add.call(this, _media);
	},
	/**
	 * @override
	 */
	function addShadow (_media) {
		var $clone;
		
		$clone = _media.$el.clone();
		$clone.data(_media.$el.data());

		this.$el.append($clone);
		return this;
	}
)}

/**
 * <span class="note important">NOTE: This constructor is used to construct its protoype which we instatiate with `AudioCollection.create()`.</span>
 * An interface for controlling a MediaElement or AudioBuffer.
 * @arg {function} $ - Passed by `type()`, gives you a pritier interface for defining the instance members.
 * @classdesc An itterable with a collection of Audio objects. This interface also exposes methods for working with it members.
 */
function Audio ($) {

	function accessConfig (_augment, _val) {
		if (_val) {
			return this[_augment] = _val;
		} else if (typeof _augment === 'string') {
			return this[_augment];
		} else {
			util.mixin(this, _augment);
		}

		return _augment;
	}

	/**
	 * Duck typed multiple inheritance.
	 */
	util.mixin(this, EventTargetInterface, PlayableInterface, StateInterface);

$(
	'type, media, activeSource, buffer, config, fileName, gain, delay',

	/**
	 * Allocates instance props.
	 * @arg {HTMLAudioElement|AudioBufferRecord} _audio - The object being wrapped.
	 * @arg {string} _type - The collection type.
	 */
	function alloc (_audio, _type) {
		var $audio, ctx, config, id;

		$audio = $$(_audio.node || _audio);
		config = $audio.pl();
		ctx = pl.game.getAudioContext();

		if (!(id = $audio.id())) $audio.id(id = util.createId());

		this.type = _type || null;
		this.fileName = util.resolveFileName($audio.attr('src'));
		this.media = $audio[0];
		this.gain = ctx.createGain();

		this.gain.connect(ctx.destination);

		$audio.data('context', this);

		if (_audio.buffer) this.buffer = _audio.buffer;

		Object.defineProperty(this, 'config', {
			value: accessConfig.bind(config),
			writeable: false
		});

		this.initialize(id, 'audio '+this.type);
	},
	/**
	 * Provides an `AudioNode` for a particular audio source.
	 * @returns
	 *  - `MediaElementSouceNode` for audio elements.
	 *  - `AudioBufferSourceNode` for an ArrayBuffer.
	 */
	function getSource () {
		var ctx, src;

		ctx = pl.game.getAudioContext();

		if (ctx) {
			if (this.buffer) {
				src = ctx.createBufferSource();
				src.buffer = this.buffer;

				return src;
			} else {
				try {
					return this.activeSource || ctx.createMediaElementSource(this.media);
				} catch(e) {
					console.warn(e.message, this);
				}
			}
		}

		return null;
	},
	/**
	 * Get the owning collection interface for an Audio object.
	 * @returns {AudioCollection}
	 */
	function collection () {
		return this.$el.closest('.collection').data('context');
	},
	/**
	 * Get the owning manager interface for an Audio object.
	 * @returns {AudioManager}
	 */
	function manager () {
		return this.$el.closest('#man').data('context');
	},
	/**
	 * Proveds a string representation of the object type.
	 */
	function toString () {
		return '[audio#'+this.id()+' '+this.fileName+']';
	}
)}

/**
 * A virtual DOM to handle navigation and propagation of events through the API interfaces.
 * For example an Audio object that triggers an event it should bubble up to its collection and on through to the manager.
 * That way you can listen for an event at any level of the interface.
 */
EventTargetInterface = {
	/**
	 * The shadow node.
	 */
	$el: null,
	/**
	 * Define a node for the shadow DOM.
	 * @arg {string} _id - Idendifier for the node.
	 * @arg {string} _class - Classification of the node.
	 */
	initialize: function (_id, _class) {
		Object.defineProperty(this, '$el', {
			value: $$('<div '+(_id ? 'id="'+_id+'"' : '')+' '+(_class ? 'class="'+_class+'"' : '')+'>'),
			writeable: false,
			configureable: false,
			enumerable: false
		});

		this.$el.data('context', this);
	},
	/**
	 * Get/set the id of the interface.
	 * @arg {string} _id - A valid CSS ID.
	 */
	id: function (_id) {
		return this.$el.id(_id);
	},
	/**
	 * Add an interface to the shadow DOM.
	 * @arg {Audio|AudioCollection} _obj - The object to add.
	 * @returns this
	 */
	addShadow: function (_obj) {
		this.$el.append(_obj.$el);
		return this;
	},
	/**
	 * Provides the parent level interface.
	 * @returns {AudioManager|AudioCollection}
	 */
	parent: function () {
		return this.$el.parent().data('context');
	},
	/**
	 * Find an interface in the API tree.
	 * @arg {string} _selector - A CSS selector to match a node in the shadow DOM API tree.
	 */
	find: function (_selector) {
		var collection = MediaCollection.create();

		// console.log(this.$el[0], 'find', _selector, this.$el.find(_selector));

		this.$el.find(_selector).each(function () {
			collection.add($$(this).data('context'));
			// console.log(this.id, '- found', this);
		});

		return collection;
	},
	/**
	 * 
	 */
	filter: function (_selector) {
		var collection;

		if (!_selector) return this;
		
		collection = MediaCollection.create();

		this.$el.children().each(function () {
			var $node = $$(this);
			if ($node.is(_selector)) collection.add($node.data('context'));
		});

		return collection;
	},
	/**
	 * Attach events to a shadow node.
	 */
	on: function () {
		this.$el.on.apply(this.$el, arguments);
		return this;
	},
	/**
	 * Remove events from a shadow node.
	 */
	off: function () {
		this.$el.off.apply(this.$el, arguments);
		return this;
	},
	/**
	 * Dispatch a event from a shadow node.
	 */
	trigger: function () {
		this.$el.trigger.apply(this.$el, arguments);
		return this;
	}
};
/**
 * Interface for inspecting an API level (i.e. manager or collection).
 */
InspectorInterface = {
	playing: function (_filterSelector) {
		var playing = this.find('.PLAYING').filter(_filterSelector);
		console.log('whats playing?', this.$el.id(), playing);
		return !!playing.length && playing;
	}
};

LegislatorInterface = {
	rule: function (_selector, _event, _handler) {
		var handler, args;

		handler = [typeof _event, typeof _handler].indexOf('function');
		args = util.toArray(arguments).slice(1);

		if (typeof _event === 'function') _event = 'play pause ended';

		this.on(_event, function (_e) {
			if (_e.target.$el.is(_selector)) args[handler].apply(this, arguments);
		}.bind(this));
	}
};

StateInterface = {
	state: function () {
		return this.$el.state.apply(this.$el, arguments);
	},

	addState: function (_state) {
		return this.$el.addClass(_state.toUpperCase());
	},

	removeState: function (_state) {
		return this.$el.removeClass(_state.toUpperCase());
	}
};

/**
 * Interface for methods involving audio control for any API level.
 */
PlayableInterface = {
	/**
	 * Play an audio object.
	 */
	play: function () {
		var ctx, src, proxyEvent, dest, delay;

		function handler (_event) {
			if (_event.type === 'ended') {
				src.disconnect();
				src = null;
			}
			proxyEvent(_event);
		}

		function playSource () {
			if (this.buffer) {
				src.start(0);
			} else {
				this.media.play();
			}
		}

		ctx = pl.game.getAudioContext();

		if (ctx.state === 'suspended') return false;

		if (this.background) return this.background.play();
		if (this.length != null) return this[0] && this[0].play();

		console.log('play', this.type, this.fileName);

		if (!(src = this.getSource())) return false;
		proxyEvent = (function (_event) {
			var theEvent = $$.Event(_event.type, { target: this, targetSource: _event.target, targetNode: this.media });

			// console.log('AUDIO', _event.type, this.fileName, this.id());

			this.trigger(theEvent);

			if (_event.type === 'ended') {
				this.removeState('PLAYING');
				this.activeSource = null;
			}

			_event.target.removeEventListener(_event.type, handler, false);
		}.bind(this));

		src.connect(this.gain);

		(src.mediaElement || src).addEventListener('ended', handler, false);

		this.addState('PLAYING');
		this.activeSource = src;

		if (delay = this.config('delay')) {
			setTimeout(playSource.bind(this), util.toMillisec(delay));
		} else {
			playSource.call(this);
		}

		handler({target: src.mediaElement || src, type: 'play'});

		return this;
	},
	/**
	 * Pause an audio object.
	 */
	pause: function () {
		return this;
	},
	/**
	 * Stop an audio object.
	 */
	stop: function (_filterSelector) {
		if (this.background) return this.background.stop(_filterSelector);
		if (this.length != null) {
			if (_filterSelector === '@ALL') {
				this.forEach(function (_audio) {
					console.log('STOP', _audio.fileName);
					_audio.stop();
				});
			} else {
				return this[0] && this[0].stop();
			}
		}

		if (!this.activeSource) return false;

		if (this.buffer) {
			this.activeSource.stop();
		} else {
			this.media.pause();
			this.media.currentTime = 0;
		}
		
		this.activeSource = null;

		return this;
	},

	volume: function (_level, _filterSelector) {
		if (this.background) return this.background.volume(_level);
		if (this.length != null) {
			if (_filterSelector === '@ALL') {
				this.forEach(function (_audio) {
					_audio.volume(_level);
				});
			} else {
				return this[0] && this[0].volume(_level);
			}
		}

		this.gain.gain.value = _level;
	}
};

export default type(MediaManager, AudioManager, AudioCollection, Audio);

AudioCollection.extend(MediaCollection);
