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
var pl = {
	Basic, Point, Size,
	game,
	util,
	
	/**
	 * @namespace
	 * @prop {string} CLICK - The device normalized click event name.
	 */
	EVENT: {
		// TODO: Find a better way to test for touch enabled devices.
		CLICK: (/ipad|iphone|android/i).test(navigator.userAgent) ? 'touchend' : 'click'
	}
};

export default pl;
