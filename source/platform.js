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

	this.EVENT_INIT = 'init';
	this.EVENT_SAVE = 'save';
	this.EVENT_EXIT = 'exit';
	this.EVENT_FLIPPED = 'flipped';

	this.emit = function (_name) {
		window.frameElement.dispatchEvent(createEvent(_name));
	};

	this.saveGameState = function (_data) {
		window.frameElement.dispatchEvent(createEvent(this.EVENT_SAVE, {
			gameData: _data
		}));
	};

	window.addEventListener('platform-event', function (_event) {
		var platformEvent;

		platformEvent = $.Event('platform-event', {
			name: _event.name
		});
		
		pl.game.trigger(platformEvent);
	});

});

export default platform;
