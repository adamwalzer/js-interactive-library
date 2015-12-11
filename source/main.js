import 'jQExtentions';
import play from 'play';

function run () {
	play.game.run();
}

// export namespace to global object;
window.play = window.pl = play;


document.addEventListener('DOMContentLoaded', run, false);

export default play;