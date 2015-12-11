import game from 'play.game';
import util from 'util';
import Basic from 'types/Basic';
import Queue from 'types/Queue';
import { Point, Size } from 'types/Dimensions';

const EVENT = {
	// gotta find a better way to test for touch enabled devices
	CLICK: (/ipad|iphone|android/i).test(navigator.userAgent) ? 'touchend' : 'click'
};

export default { EVENT, Basic, Point, Size, Queue, game, util };