import game from 'play.game';
import util from 'util';

const EVENT = {
	// gotta find a better way to test for touch enabled devices
	CLICK: (/ipad|iphone|android/i).test(navigator.userAgent) ? 'touchend' : 'click'
}

export default { EVENT, game, util };