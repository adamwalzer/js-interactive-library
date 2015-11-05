pl.game.component('carousel', function () {
	
	this.$images = null;

	this.ready = function () {
		console.log('carousel ready');

		// As a rule you should define properties before calling sup().
		this.$images = this.find('img');

		return this.proto();
	};

	this.beginShow = function () {
		console.log('carousel beginShow');
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
		this.proto();
		return this.beginShow();
	};
});