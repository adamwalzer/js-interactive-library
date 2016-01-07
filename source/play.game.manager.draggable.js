import util from 'util';
import Collection from 'types/Collection';
import { Point } from 'types/Dimensions';

const COLLECTION_DRAGABLES = Collection.create();

function boot () {
	attachEvents();
}

function attachEvents () {
	var state;

	$(document)
		.on('mousedown', function (_event) {
			var cursor, $draggable, transform, point, mode, style, dragStartEvent;

			cursor = resolveEventPoint(_event);
			$draggable = $(_event.target).closest('[pl-draggable]');


			if ($draggable.length) {
				mode = $draggable.attr('pl-draggable');
				point = $draggable.absolutePosition();
				transform = $draggable.transform();
				// TODO: Set these styles in a style node.
				// That way I dont have to override them important :/
				style = util.mixin({}, window.getComputedStyle($draggable[0]));

				delete style.zIndex;
				delete style.opacity;
				delete style.cursor;
				delete style.transition;
				delete style.transitionDelay;
				delete style.transitionDuration;
				delete style.transitionProperty;
				delete style.transitionTimingFunction;

				state = {
					mode: mode,
					$draggable: $draggable,
					scope: $draggable.scope(),
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

				switch (mode) {
					case 'clone':
						state.$helper = $draggable.clone();
						state.$helper
							.removeAttr('pl-draggable') // helpers are not to be captured as draggable
							.addClass('draggable-helper')
							.css(style) // preserves the style of the draggable.
							.appendTo(document.body)
							.absolutePosition(point);
						break;

					case 'pluck':
						$draggable.addClass('PLUCKED');

						state.$helper = $draggable.clone();
						state.$helper
							.removeAttr('pl-draggable') // helpers are not to be captured as draggable
							.addClass('draggable-helper')
							.css(style) // preserves the style of the draggable.
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
					targetScope: state.scope
				});

				state.scope.trigger(dragStartEvent);
			}
		})

		.on('mousemove', function (_event) {
			var cursor, $draggable, distance, point, transform, dragMoveEvent;

			if (state) {
				cursor = resolveEventPoint(_event);
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

		.on('mouseup mouseout', function (_event) {
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

function resolveEventPoint (_event) {
	var x, y;

	if (_event.touches) {
		x = _event.touches[0].clientX;
		y = _event.touches[0].clientY;
	}

	else {
		x = _event.clientX;
		y = _event.clientY;
	}

	return Point.create().set(x, y);
}

var draggableManager = {

};

boot();

export default draggableManager;