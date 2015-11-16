pl.game.component('screen-basic', function () {
	
	this.next = function () {
		var nextScreen;
		nextScreen = this.proto();

		if (nextScreen) {
			this.leave();
			nextScreen.open();
		}

		return nextScreen;
	};

	this.on('ui-open', function (_event) {
			console.log('opened', this.address());
		if (this.isReady && this === _event.targetScope) {
			this.start();
		}
	});

	this.on('ui-leave', function (_event) {
		if (this.isReady && this === _event.targetScope) {
			this.stop();
		}
	});

});