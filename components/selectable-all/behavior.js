pl.game.component('selectable-all', function () {

	var Column;

	function populateViewport () {
		var width, item, i, columns;

		// width of the first item
		width = this.$bin.width();
		columns = Math.floor(this.$viewport.width() / width);

		for (i=0; i < columns; i+=1) {
			this.columns.push(Column.create().init(this.$bin, this.$viewport));
		}
	}

	Column = pl.Basic.extend(function () {

		this.$el = null;
		this.$collection = null;
		this.$viewport = null;
		this.shouldRecycel = true;

		this.init = function (_$collection, _$viewport) {
			this.$collection = _$collection;
			this.$viewport = _$viewport;
			this.$el = $(pl.util.random(_$collection)).clone();

			this.$el.css({
				transitionDuration: (pl.util.random(5, 10)*(1+Math.random()))+'s'
			});

			this.$viewport.append(this.$el);

			return this;
		};
		
		this.recycle = function () {
			var $clone;

			if (!this.shouldRecycel) return;

			$clone = $(pl.util.random(this.$collection)).clone();
			$clone.css({
				transitionDuration: (pl.util.random(7, 15)*(1+Math.random()))+'s'
			});

			this.$el.replaceWith($clone);
			this.$el = $clone;

			setTimeout(this.bind(function () {
				this.launch();
			}), 0);

			return $clone;
		};

		this.launch = function () {
			this.$el.on('transitionend', this.bind(function () {
				if (!this.recycle()) {
					this.$el.off();
				}
			}));

			this.$el.addClass('LAUNCHED');
		};

		this.bind = function (_fun) {
			var self = this;
			return function () {
				return _fun.apply(self, arguments);
			};
		}

	});

	this.$viewport = null;
	this.$bin = null;
	this.columns = null;
	
	this.init = function () {
		this.$viewport = this.find('.viewport');
		this.$bin = this.find('.bin li');
		this.columns = [];

		this.$bin.each(this.bind(function (_index, _node) {
			var $node, message
			
			$node = $(_node);
			message = $node.attr('pl-message')

			if ($node.attr('pl-correct') != null) {
				this.screen.require(message);	
			}
			
		}));
		
		populateViewport.call(this);

		return this;
	};

	this.start = function () {
		this.columns.forEach(function (_item) {
			_item.launch();
		});
	};

	this.stop = function () {
		this.columns.forEach(function (_item) {
			_item.shouldRecycel = false;
			_item.$el.removeClass('LAUNCHED').css('transition', 'none');
		});
	};

	this.behavior('pick', function (_$target) {
		var message = _$target.attr('pl-message');

		console.log(this.event.target);

		if (_$target.attr('pl-correct') == null) return;

		this.screen.requiredQueue.ready(message);

		this.highlight(_$target);

		return {
			message: message,
			behaviorTarget: _$target
		};
	});

});