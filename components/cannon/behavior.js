pl.game.component('cannon', function () {

	this.behavior('fire', function () {
		this.launch()
		return {
			message: this.properties.fire
		};
	});

	this.launch = function () {
		this.ball.removeClass('RELOAD').addClass('LAUNCHED');
	};

	this.reload = function () {
		this.ball.addClass('RELOAD').removeClass('LAUNCHED');
	};

	this.didLaunch = function () {
		return this.ball.hasClass('LAUNCHED');
	};

});