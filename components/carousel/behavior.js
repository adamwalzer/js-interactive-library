pl.game.component('carousel', function () {

	this.TYPE = (function () {
		
		this.SLIDE = 'slide';
		this.CROSS_FADE = 'cross-fade';

		return this;

	}).call(['slide', 'cross-fade']);

	this.type = null
	this.$images = null;
	this.nodes = null;
	this.shouldRandomize = false;
	this.isPlaying = false;

	this.ready = function () {
		this.$images = this.find('img');
		this.shouldRandomize = this.properties.has('randomize');

		if (this.TYPE.every(this.bind(function (_type) {
			return !this.hasClass(_type);
		}))) {
			this.addClass(this.TYPE.CROSS_FADE);
		}

		if (this.$images.length) {
			this.nodes = [];
			this.$images.each(this.bind(function (_index, _item) {
				this.nodes.push(_item);
			}));
		}
		
		this.TYPE.forEach(this.bind(function (_item) {
			if (this.hasClass(_item)) this.type = _item;
		}));

		this.on('transitionend', function (_event) {
			if (_event.target.nodeName === 'IMG' && $(_event.target).state(this.STATE.LEAVE)) {
				this.recycle();
			}
		});
	};

	this.provideBehaviorTarget = function () {
		return this.current();
	};

	this.respond('fire', function (_event) {
		this.hit(_event.message);
	});

	this.behavior('hit', function (_message) {
		return {
			message: _message,
			behaviorTarget: this.provideBehaviorTarget()
		};
	});

	this.behavior('next', function () {
		var current;

		current = this.$images.first();

		this.leave(current);
		this.open(current.next());
	});

	this.start = function () {
		var delay;

		delay = pl.util.toMillisec(this.properties.delay) || 1000;

		if (this.isReady && !this.isPlaying) {
			this.isPlaying = true;
			this.open(this.$images.first());
			this.repeat(delay, this.next);
		}
		
		else {
			this.on('ready', this.beginShow);
		}
	};

	this.stop = function () {
		this.kill('repeat');
	};

	this.current = function () {
		return this.$images.filter('.OPEN');
	};

	this.recycle = function () {
		var $current, reload;

		$current = this.$images.first();
		reload = this.reloadWithNode(this.$images[0]);

		$current.removeClass(this.STATE.LEAVE);
		$current.remove();

		[].shift.call(this.$images);

		this.$images.push(reload);
		this.append(reload);

		return this;
	};

	this.reloadWithNode = function (_item) {
		var $clone, state;

		if (this.shouldRandomize) {
			$clone = $(pl.util.random(this.nodes)).clone();
			state = $clone.state();

			if (state) $clone.removeClass(state.join ? state.join(' ') : state);

			return $clone[0];
		}

		return _item;
	};


});