pl.game.component('cannon', function () {

	this.behavior('fire', function () {
		return {
			message: this.properties.fire
		};
	});

});