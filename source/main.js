/**
 * Boot file for the Play library.
 *
 * @module
 *
 * @author Micah Rolon <micah@ginasink.com>
 *
 * @requires jQExtentions
 * @requires play
 */
import 'jQExtentions';
import play from 'play';

/**
 * Begin running the library
 */
function run () {
	play.game.run();
}

// export namespace to global object.
window.play = window.pl = play;

// Invoke 'run' when DOM has finished loading.
document.addEventListener('DOMContentLoaded', run, false);
