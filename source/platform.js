/**
 * API for communicaion between a game and the platform.
 *
 * @module
 */
import util from 'util';

var platform = new (function () {

	function createEvent (_name, _props) {
		var eventObject;

		eventObject = util.mixin(new Event('game-event', {bubbles:true, cancelable:false}), {
			name: _name,
			respond: function (_data) {
				var platformEvent;

				platformEvent = $.Event('platform-event', {
					name: _name,
					gameData: _data
				});
				
				pl.game.trigger(platformEvent);
			}
		}, _props);

		return eventObject;
	}
	
	this.getGameState = function () {
		var gameEvent;

		gameEvent = createEvent('init');

		window.frameElement.dispatchEvent(gameEvent);
	};

	this.saveGameState = function (_data) {
		var gameEvent;

		gameEvent = createEvent('save', {
			gameData: _data
		});

		window.frameElement.dispatchEvent(gameEvent);
	};

});

export default platform;
