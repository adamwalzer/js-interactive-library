import util from 'util';
import Collection from 'types/Collection';
import { Point } from 'types/Dimensions';

const COLLECTION_DRAGABLES = Collection.create();

var draggableStyleSheet;

function boot () {
	createHelperStyleSheet();
	attachEvents();
}

function attachEvents () {
	var state, E;

	E = pl.EVENT;

	if (E.ACTION_MOVE === 'touchmove') document.addEventListener(E.ACTION_MOVE, function (_event) {
		_event.preventDefault();
	}, false);

	$(document)
		.on(E.ACTION_DOWN, function (_event) {
			var $draggable, scope, cursor, mode, game, point, transform, helperID, dragStartEvent;

			$draggable = $(_event.target).closest('[pl-draggable]');

			if ($draggable.length) {
				scope = $draggable.scope();
				cursor = resolveEventPoint(_event, 1/scope.game.zoom);
				mode = $draggable.pl('draggable');
				game = {
					position: scope.game.absolutePosition(),
					scale: scope.game.transformScale().x
				};
				point = $draggable.absolutePosition().dec(game.position);
				transform = $draggable.transform();
				helperID = createID();
				state = {
					mode: mode,
					$draggable: $draggable,
					scope: scope,
					$helper: null,

					start: {
						cursor: cursor,
						point: point,
						transform: transform
					},

					progress: {
						distance: null,
						point: null,
						transform: null
					}
				};

				// FireFox has a different scaling implementation than other browsers (transform:scale(); vs. zoom:;)
				// so we need to account for the game transform scale.
				// 
				if (game.scale !== 1) point = point.scale(1/game.scale);

				draggableStyleSheet.html( provideSource( helperID, createDraggableRule($draggable)));

				switch (mode) {
					case 'clone':
						state.$helper = $draggable.clone();
						state.$helper
							.id(helperID)
							.pl('draggable', null) // helpers are not to be captured as draggable
							.addClass('draggable-helper')
							.appendTo(document.body)
							.absolutePosition(point);
						break;

					case 'pluck':
						$draggable.addClass('PLUCKED');

						state.$helper = $draggable.clone();
						state.$helper
							.id(helperID)
							.pl('draggable', null) // helpers are not to be captured as draggable
							.addClass('draggable-helper')
							.appendTo(document.body)
							.absolutePosition(point);
						break;

					default:
						state.$helper = $draggable;
						break;
				}

				state.$helper.removeClass('DRAG-ENDED')
					.addClass('DRAG-START');

				dragStartEvent = $.Event('drag-start', {
					state: state,
					targetScope: scope
				});

				scope.trigger(dragStartEvent);
			}
		})

		.on(E.ACTION_MOVE, function (_event) {
			var cursor, $draggable, distance, point, transform, dragMoveEvent;

			if (state) {
				cursor = resolveEventPoint(_event, 1/state.scope.game.zoom);
				distance = state.start.cursor.distance(cursor);
				point = Point.create();
				transform = null;

				if (state.start.transform !== 'none') {
					transform = state.start.transform.clone();
					transform.translate(distance.width, distance.height);
					point.set(transform.applyToPoint(0, 0));
				}

				else {
					point = distance.to('point');
				}

				if (state.$helper.hasClass('DRAG-START')) {
					state.$helper
						.removeClass('DRAG-START')
						.addClass('DRAGGING');
				}

				dragMoveEvent = $.Event('drag-move', {
					state: state,
					targetScope: state.scope
				});

				state.progress.distance = distance;
				state.progress.point = state.start.point.inc(point);
				state.progress.transform = transform;

				state.scope.translate(state.$helper, point);
				state.scope.trigger(dragMoveEvent);
			}
		})

		.on([E.ACTION_UP, E.ACTION_OUT].join(' '), function (_event) {
			var $draggable, dragEndEvent;

			if (state) {
				// Do not end dragging if we dont mouse out of the document.
				if (_event.type === 'mouseout' && !~[null, document.documentElement].indexOf(_event.toElement)) {
					return;
				}

				$draggable = state.$draggable;

				if (state.$helper.hasClass('draggable-helper')) {
					state.$helper.on('transitionend', function () {
						$draggable.removeClass('PLUCKED');
						$(this).remove();
					});
				}

				state.$helper
					.removeClass('DRAG-START DRAGGING')
					.addClass('DRAG-ENDED');

				dragEndEvent = $.Event('drag-end', {
					state: state,
					targetScope: state.scope
				});

				state.scope.trigger(dragEndEvent);

				state = null;
			}
		});
}

function resolveEventPoint (_event, _scale) {
	var x, y, scale;

	scale = _scale || 1;

	if (_event.touches) {
		x = _event.touches[0].clientX;
		y = _event.touches[0].clientY;
	}

	else {
		x = _event.clientX;
		y = _event.clientY;
	}

	return Point.create().set(x * scale, y * scale);
}

function createHelperStyleSheet () {
	draggableStyleSheet = $('<style id="draggable-helper-css" type="text/css"></style>').appendTo(document.body);
}

function createDraggableRule (_$draggable) {
	var i, style, blacklist, rule, prop;

	style = window.getComputedStyle(_$draggable[0]);
	rule = {};
	blacklist = [
		"zIndex",
		"opacity",
		"cursor",
		"transition",
		"transitionDelay",
		"transitionDuration",
		"transitionProperty",
		"transitionTimingFunction"
	];

	for (i=0; i < style.length; i+=1) {
		prop = util.transformId(style[i], true);
		if (~blacklist.indexOf(prop)) continue;
		if (prop.indexOf('Webkit') === 0) prop = prop.slice(0,1).toLowerCase()+prop.slice(1);
		if (style[prop]) rule[prop] = style[prop];
	}

	return rule;
}

function provideSource (_id, _rule) {
	var source, prop, value;

	source = '#'+_id+'.draggable-helper {';

	for (prop in _rule) {
		if (!_rule.hasOwnProperty(prop)) continue;
		value = _rule[prop];
		source += prop.replace(/([A-Z]+)/g, '-$1').toLowerCase()+': '+value+';'
	}

	source += '}';

	return source;
};

function createID () {
	return 'xy-xyxy-y'.replace(/x|y/g, function (_token) {
		if (_token === 'x') return (Math.floor(Math.random() * 5) + 10).toString(16);
		return Math.floor(Math.random() * Date.now()).toString(16).slice(2);
	});
}

var draggableManager = {

};

$(boot);

export default draggableManager;
