pl.game.component('select', function () {
	
	this.select = function (_target) {
		var $li;

		$li = $(_target).parent();

		if (!$li.hasClass(this.STATE.DISABLED) && !this.parent().scope().state(this.STATE.VOICE_OVER)) {

			if ($li.prev().hasClass(this.STATE.DISABLED) || $li.index() === 0) {
				this.disable($li);
				this.reval.item($li.index());
			}	
		}

		return this;
	};

});