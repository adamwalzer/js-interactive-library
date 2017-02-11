import classNames from 'classnames';

import Component from 'components/component';

const IMAGE = 'image';
const AREA = 'area';
const CONTENT = 'content';
const SCROLLBAR = 'scrollbar';
const SCROLLER = 'scroller';

class ScrollArea extends Component {
    constructor(props) {
        super(props);

        this.state = _.defaults({
            startY: 0,
            endY: 0,
            zoom: 1,
        }, this.state);

        this.setZoom = this.setZoom.bind(this);

        this.mouseDown = this.mouseDown.bind(this);
        this.mouseUp = this.mouseUp.bind(this);

        this.moveEvent = this.moveEvent.bind(this);

        this.touchStart = this.touchStart.bind(this);
        this.touchEnd = this.touchEnd.bind(this);
    }

    start() {
        super.start(() => {
            this[AREA].scrollTop = 0;
            this.setState({
                startY: 0,
                endY: 0,
            });
        });
    }

    bootstrap() {
        super.bootstrap();

        this.setZoom();
        window.addEventListener('resize', this.setZoom);

        this[AREA] = ReactDOM.findDOMNode(this.refs[AREA]);
        this[CONTENT] = ReactDOM.findDOMNode(this.refs[CONTENT]);
        this[SCROLLBAR] = ReactDOM.findDOMNode(this.refs[SCROLLBAR]);
        this[SCROLLER] = ReactDOM.findDOMNode(this.refs[SCROLLER]);

        this[AREA].scrollTop = 0;

        this[AREA].addEventListener('scroll', e => {
            var areaScrollTop;
            var endY;

            if (!e.target || this.dragging) return;

            areaScrollTop = e.target.scrollTop;
            endY = (this[SCROLLBAR].offsetHeight - this.props.scrollbarHeight) *
                (areaScrollTop / (this[CONTENT].offsetHeight - this[AREA].offsetHeight));

            this.setState({
                startY: 0,
                endY,
            });
        });

        this[SCROLLER].addEventListener('mousedown', this.mouseDown);
        this[SCROLLER].addEventListener('touchstart', this.touchStart);
    }

    setZoom() {
        skoash.trigger('getState').then(state => {
            this.setState({
                zoom: state.scale,
            });
        });
    }

    mouseDown(e) {
        this.startEvent(e, this.attachMouseEvents);
    }

    touchStart(e) {
        this.startEvent(e, this.attachTouchEvents);
    }

    startEvent(e, cb) {
        var startY;
        var endY;

        if (e.target !== this[SCROLLER]) return;

        this.dragging = true;

        e = e.targetTouches && e.targetTouches[0] ? e.targetTouches[0] : e;

        endY = this.getEndY(e);
        startY = this.state.startY || endY;

        this.setState({
            startY,
            endY,
        });

        if (typeof cb === 'function') cb.call(this);
    }

    getEndY(e) {
        return Math.min(
      Math.max(
        e.pageY / this.state.zoom,
        this.state.startY
      ),
      this.state.startY +
      this[SCROLLBAR].getBoundingClientRect().height / this.state.zoom -
      this.props.scrollbarHeight
    );
    }

    attachMouseEvents() {
        window.addEventListener('mousemove', this.moveEvent);
        window.addEventListener('mouseup', this.mouseUp);
    }

    attachTouchEvents() {
        window.addEventListener('touchmove', this.moveEvent);
        window.addEventListener('touchend', this.touchEnd);
    }

    moveEvent(e) {
        var endY;

        e = e.targetTouches && e.targetTouches[0] ? e.targetTouches[0] : e;

        endY = this.getEndY(e);

        this[AREA].scrollTop = (endY - this.state.startY) *
      (this[CONTENT].offsetHeight - this[AREA].offsetHeight) /
      (this[SCROLLBAR].offsetHeight - this.props.scrollbarHeight);

        this.setState({
            endY,
        });
    }

    mouseUp() {
        this.dragging = false;
        this.detachMouseEvents();
    }

    touchEnd() {
        this.dragging = false;
        this.detachTouchEvents();
    }

    detachMouseEvents() {
        window.removeEventListener('mousemove', this.moveEvent);
        window.removeEventListener('mouseup', this.mouseUp);
    }

    detachTouchEvents() {
        window.removeEventListener('touchmove', this.moveEvent);
        window.removeEventListener('touchend', this.touchEnd);
    }

    getScrollerStyle() {
        return {
            backgroundImage: `url(${this.props.img})`,
            top: this.state.endY - this.state.startY,
        };
    }

    getClassNames() {
        return classNames('scroll-area', super.getClassNames());
    }

    render() {
        if (!this.props.shouldRender) return null;

        return (
            <this.props.type {...this.props} className={this.getClassNames()}>
                <skoash.Image ref={IMAGE} className="hidden" src={this.props.img} />
                <div ref={AREA} className={AREA}>
                    <div ref={CONTENT} className={CONTENT}>
                        {this.renderContentList()}
                    </div>
                </div>
                <div
                    ref={SCROLLBAR}
                    className={SCROLLBAR}
                >
                    <div
                        ref={SCROLLER}
                        className={SCROLLER}
                        style={this.getScrollerStyle()}
                    />
                </div>
            </this.props.type>
        );
    }
}

ScrollArea.defaultProps = _.defaults({
    img: '',
    scrollbarHeight: 100,
}, Component.defaultProps);

export default ScrollArea;
