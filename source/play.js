/**
 * Defines the global root level namespace for the library.
 *
 * @module
 * @author Micah Rolon <micah@ginasink.com>
 *
 * @requires game
 * @requires module:play~pl.util
 * @requires types/Basic
 * @requires types/Dimensions
 */
import game from 'play.game';
import util from 'util';
import Basic from 'types/Basic';
import Queue from 'types/Queue';
import { Point, Size } from 'types/Dimensions';

var pl;
/**
 * Resolves the event type for user interactions.
 */
function resolveEventType () {
	var resolution;

	if (game.feature('touch')) {
		resolution = {
			ACTION: 'touchend',
			ACTION_DOWN: 'touchstart',
			ACTION_UP: 'touchend',
			ACTION_MOVE: 'touchmove',
			ACTION_OUT: 'touchcancel'
		};
	} else {
		resolution = {
			ACTION: 'click',
			ACTION_DOWN: 'mousedown',
			ACTION_UP: 'mouseup',
			ACTION_MOVE: 'mousemove',
			ACTION_OUT: 'mouseout'
		};
	}

	return resolution;
}

/**
 * Globaly accesable, root level namespace for the library.
 * @namespace
 * @prop {object} EVENT - Namespace for noralized event name constants.
 * @prop {Basic} Basic - Base object type.
 * @prop {Point} Point - Object type which holds values on a 2D cartesian plane.
 * @prop {Size} Size - Object type which holds 2-dimentional values for size.
 * @prop {function} game - Registers a game view implementation. Also a namespace for other methods.
 * @prop {object} util - Namespace for utility functions.
 */
pl = {
	Basic, Point, Size, Queue,
	game,
	util,
	
	/**
	 * @namespace
	 * @prop {string} ACTION - The device normalized `click` event name.
	 * @prop {string} ACTION_DOWN - The device normalized `mousedown` event name.
	 * @prop {string} ACTION_UP - The device normalized `mouseup` event name.
	 * @prop {string} ACTION_MOVE - The device normalized `mousemove` event name.
	 * @prop {string} ACTION_OUT - The device normalized `mouseout` event name.
	 */
	EVENT: resolveEventType()
};

export default pl;
