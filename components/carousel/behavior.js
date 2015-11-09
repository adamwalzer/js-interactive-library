pl.game.component('carousel', function () {

	this.TYPE = (function () {
		
		this.SLIDE = 'slide';
		this.CROSS_FADE = 'cross-fade';

		return this;

	}).call(['slide', 'cross-fade']);

	this.type = null
	this.$images = null;
	this.shouldRandomize = false;
	this.isPlaying = false;

	this.ready = function () {
		this.$images = this.find('img');
		
		this.TYPE.forEach(this.bind(function (_item) {
			if (this.hasClass(_item)) this.type = _item;
		}));

		this.on('transitionend', function (_event) {
			if (_event.target.nodeName === 'IMG' && $(_event.target).hasClass(this.STATE.LEAVE)) {
				this.recycle();
			}
		});

		this.screen.on('behavior', function (_event) {
			console.log('responding to behavior', _event.name);
		});
	};

	this.beginShow = function () {
		if (this.isReady) {
			this.isPlaying = true;
			this.open(this.current());
			this.repeat(3000, this.next);
		}
		
		else {
			this.on('ready', this.beginShow);
		}
	};

	this.current = function () {
		return this.$images.first();
	};

	this.next = function () {
		this.leave(this.current());
		this.open(this.$images.eq(1));
	};

	this.recycle = function () {
		var $current, reload;

		$current = this.current();
		reload = this.reloadWithNode(this.$images[0]);

		$current.removeClass(this.STATE.LEAVE);

		[].shift.call(this.$images);

		this.$images.push(reload);
		this.append(reload);

		return this;
	};

	this.reloadWithNode = function (_item) {
		if (this.shouldRandomize) {
			return pl.util.random(this.$images);
		}

		return _item;
	};
});