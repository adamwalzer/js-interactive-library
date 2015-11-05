pl.game.component('reval', function () {

	this.audio = null;

	this.ready = function () {
		this.audio = this.find('audio');
	};

	this.item = function (_index) {
		this.open(this.find('li').eq(_index));
		this.audio[_index].play();
	};

});