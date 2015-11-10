pl.game.component('score', function () {

	this.value = 0;

	this.entity('.board', function () {
		
		this.template = null;

		this.ready = function () {
			this.template = this.html();
		};

		this.render = function () {
			this.html(this.template.replace('{{score}}', this.value));
			return this;
		};
	});

	this.up = function (_count) {
		this.value+= _count || 1;

		return this.board.render();
	};

	this.down = function (_count) {
		this.value-= _count || 1;

		return this.board.render();
	};

});