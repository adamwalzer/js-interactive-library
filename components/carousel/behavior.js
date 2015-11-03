pl.game.component('carousel', function () {
	
	this.$images = null;

	this.ready = function () {
		this.sup();

		this.$images = this.find('img');

		return this;
	};

	this.beginShow = function () {
		if (this.isReady) {
			this.repeat(3000, function () {
				this.$images
					.filter('.OPEN')
					.removeClass('OPEN')
					.next()
					.addClass('OPEN');
			});	
		}
		
		else {
			this.on('ready', this.beginShow);
		}
	};

	this.open = function () {
		this.sup();
		return this.beginShow();
	};
});

console.log('parsed');