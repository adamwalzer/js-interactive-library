pl.game.component('title', function () {

	this.ready = function () {
		this.open();
		this.delay(1500, function () {
			this.image.addClass('animated '+this.image.attr('pl-animation'));
		});
	};

});