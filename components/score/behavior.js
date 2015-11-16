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

	this.init = function () {
		this.screen.require(this);
	};

	this.ready = function () {
		this.board.render();
	};

	this.up = function (_count) {
		this.value+= _count || 1;

		this.board.render();

		console.log('score', this.value, this.properties.max)

		if (this.value == this.properties.max) {
			console.log('oh word');
			this.complete();
		}

		return this;
	};

	this.down = function (_count) {
		this.value-= _count || 1;

		this.board.render();
		
		if (this.value == this.properties.max) {
			this.complete();
		}

		return this;
	};

});