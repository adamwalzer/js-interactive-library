pl.game.component('reval', function () {

	this.init = function () {
		// Move this into a watchEntityAudioEvents()
		this.on('audio-play audio-ended', function (_event) {
			var parent;

			parent = this.parent().scope();

			switch (_event.type) {
				case 'audio-play':
					parent.addClass('PLAYING '+_event.audioType.toUpperCase());
					break;

				case 'audio-ended':
					parent.removeClass('PLAYING '+_event.audioType.toUpperCase());
					break;
			}
		});
	};

	this.item = function (_index) {
		this.open(this.find('li').eq(_index));
		this.audio.voiceOver[_index].play();
	};

});