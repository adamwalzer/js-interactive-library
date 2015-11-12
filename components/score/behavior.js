pl.game.component('score', function () {

	this.value = 0;
	this.max = 0;

	this.handleProperty(function () {
		this.max = function (_node, _name, _value, _property) {
			this.max = Number(_value);
		};
	});

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

	this.init = function () {
		this.screen.require(this);
	}

	this.ready = function () {
		this.board.render();
	};

	this.up = function (_count) {
		this.value+= _count || 1;

		this.board.render();

		if (this.value === this.max) {
			this.complete();
		}

		return this;
	};

	this.down = function (_count) {
		this.value-= _count || 1;

		this.board.render();
		
		if (this.value === this.max) {
			this.complete();
		}

		return this;
	};

});