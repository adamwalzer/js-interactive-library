/**
*  Game
*  @desc Contains...
*  @proto GlobalScope
*/

import GlobalScope from 'types/GlobalScope';

var Game = GlobalScope.extend(function () {

	this.baseType = 'TYPE_GAME';

	this.setup = function () {
		var game;

		game = this;

		this.screens.forEach(function (_screen) {
			_screen.game = game;
		});

		this.addClass('pl-game');

		this.proto();

		this.captureAudioAssets();

		return this;
	};

	this.attachEvents = function () {
		this.proto();
		this.watchAudio();

		return this;
	};

	this.watchAudio = function () {
		var playing;

		playing = [];

		this.on('audio-play', function (_event) {
			if (!~playing.indexOf(_event.audioType)) {
				playing.push(_event.audioType);
			}

			if (_event.audioType === 'voice-over') {
				if (~playing.indexOf('background')) {
					this.audio.background.music.volume = 0.2;
				}
			}
		});

		this.on('audio-ended', function (_event) {
			var index;

			index = playing.indexOf(_event.audioType);
			if (~index) playing.splice(index, 1);

			if (_event.audioType === 'voice-over') {
				this.audio.background.music.volume = 1;
			}
		});
	};

});

export default Game;