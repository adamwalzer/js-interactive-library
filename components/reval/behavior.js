pl.game.component('reval', function () {
	
	this.handleProperty(function () {
		this.id = function (_node, _name, _value, _property) {
			this[_value] = $(_node);
		};
	});

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

	this.item = function (_id) {
		var vo, index;

		this.close(this.find('li.OPEN'));

		if (typeof _id === 'number') {
			this.open(this.find('li').eq(_id));
			this.audio.voiceOver[_id].play();
		}
			
		else if (typeof _id === 'string') {
			if (this[_id]) {
				this.open(this[_id]);

				if (this.audio) {
					index = this[_id].index();
					vo = this.audio.voiceOver[_id] || this.audio.voiceOver[index];
					
					if (vo) vo.play();
				}
			}
		}
	};

});