pl.game.component('carousel', function () {
	this.$images = null;

	this.setup = function () {
		this.sup();

		this.$images = this.find('img');

		return this;
	};

	this.beginShow = function () {
		this.repeat(3000, function () {
			this.$images
				.filter('.OPEN')
				.removeClass('OPEN')
				.next()
				.addClass('OPEN');
		});
	};

	this.open = function () {
		this.sup();
		return this.beginShow();
	};
});

console.log('parsed');