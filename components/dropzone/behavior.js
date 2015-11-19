pl.game.component('dropzone', function () {
	
	this.zone = null;

	this.handleProperty(function () {
		this.dropzone = function (_node, _name, _value, _property) {
			this.zone = $(_node);
		};
	});

	this.init = function () {
		this.addClass('dropable');

		if (!this.zone) {
			this.zone = this.$els;
		}

		this.zone.addClass('dropzone');
	};

	this.respond('dragging', function (_event) {
		console.log('** respond dragging', _event.state.point);
	});
});