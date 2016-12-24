import classNames from 'classnames';
import shortid from 'shortid';

import Component from 'components/component';

function loadJSON(file, callback) {
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType('application/json');
    xobj.open('GET', file, true);
    xobj.onreadystatechange = function () {
        /* eslint-disable eqeqeq */
        if (xobj.readyState == 4 && xobj.status == '200') {
            callback(JSON.parse(xobj.responseText));
        }
        /* eslint-enable eqeqeq */
    };
    xobj.send(null);
}

class Sprite extends Component {
    constructor(props) {
        super(props);

        this.state = _.defaults({
            frame: props.frame,
        }, this.state);

        this.uniqueID = shortid(Math.random());
        this.lastAnimation = Date.now();

        this.setUp(props);
    }

    setUp(props) {
        var maxWidth;
        var maxHeight;
        var minX;
        var minY;

        this.image = `${props.src}.${props.extension}`;

        if (props.frames) {
            this.frames = props.frames;
            this.data = {};
            this.checkReady();
            this.update(props);
        } else {
            loadJSON(`${props.src}.${props.dataExtension}`, data => {
                this.data = data;
                this.frames = data.frames.length;
                this.checkReady();
                this.update(props);

                minX = _.reduce(data.frames, (a, v) => Math.min(a, v.spriteSourceSize.x), Infinity);
                minY = _.reduce(data.frames, (a, v) => Math.min(a, v.spriteSourceSize.y), Infinity);
                maxWidth = _.reduce(data.frames, (a, v) =>
                    Math.max(a, v.spriteSourceSize.x + v.spriteSourceSize.w - minX), 0);
                maxHeight = _.reduce(data.frames, (a, v) =>
                    Math.max(a, v.spriteSourceSize.y + v.spriteSourceSize.h - minY), 0);

                this.setState({
                    maxWidth,
                    maxHeight,
                    minX,
                    minY,
                });
            });
        }

        if (props.animateForwards) {
            this.animateForwards();
        } else if (props.animateBackwards) {
            this.animateBackwards();
        }
    }

    update(props) {
        var top;
        var left;
        var backgroundPosition;
        var backgroundSize;
        var width;
        var height;

        props = props || this.props;

        if (props.frames) {
            // todo later
        } else {
            this.frameData = this.data.frames[this.state.frame];
            top = this.frameData.spriteSourceSize.y;
            left = this.frameData.spriteSourceSize.x;
            backgroundPosition =
                `-${this.frameData.frame.x}px -${this.frameData.frame.y}px`;
            backgroundSize =
                `${this.data.meta.size.w}px ${this.data.meta.size.h}px`;
            width = this.frameData.frame.w;
            height = this.frameData.frame.h;
        }

        this.frameRate = props.duration / this.frames;

        this.setState({
            top,
            left,
            backgroundPosition,
            backgroundSize,
            width,
            height,
        });
    }

    bootstrap() {
        super.bootstrap();
        if (this.props.hoverFrame) this.setUpHover(this.props);
    }

    setUpHover(props) {
        this.refs.sprite.addEventListener('mouseover', () => {
            this.setState({ frame: props.hoverFrame }, () => {
                this.update();
            });
        });

        this.refs.sprite.addEventListener('mouseout', () => {
            this.setState({ frame: props.frame }, () => {
                this.update();
            });
        });
    }

    ready() {
        if (this.data) super.ready();
    }

    animateForwards() {
        this.animate(1);
    }

    animateBackwards() {
        this.animate(-1);
    }

    animate(i) {
        var now = Date.now();

        if (this.props.static || this.props.pause) return;

        if (!this.props.loop) {
            if (this.props.animateForwards) {
                if (this.state.frame === this.frames - 1) return;
            } else if (this.props.animateBackwards) {
                if (this.state.frame === 0) return;
            }
        }

        if (now > this.lastAnimation + this.frameRate) {
            this.lastAnimation = now;
            this.setState({
                frame: (this.state.frame + i + this.frames) % this.frames
            }, () => {
                this.update(this.props);
            });
        }

        window.requestAnimationFrame(() => {
            this.animate(i);
        });
    }

    componentWillReceiveProps(props) {
        super.componentWillReceiveProps(props);

        if (props.src !== this.props.src || props.frames !== this.props.frames) {
            this.setUp(props);
        }

        if (props.frame !== this.props.frame) {
            this.setState({ frame: props.frame });
        }

        if (props.animateForwards) {
            this.animateForwards();
        } else if (props.animateBackwards) {
            this.animateBackwards();
        }
    }

    getContainerStyle() {
        var width;
        var height;

        if (!this.props.static) {
            width = this.state.maxWidth;
            height = this.state.maxHeight;
        }

        return {
            display: 'inline-block',
            width,
            height,
        };
    }

    getStyle() {
        var position;
        var top;
        var left;

        if (!this.props.static) {
            position = 'absolute';
            top = this.state.top - this.state.minY;
            left = this.state.left - this.state.minX;
        }

        return {
            position,
            top,
            left,
            backgroundImage: `url(${this.props.src}.${this.props.extension})`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: this.state.backgroundPosition,
            backgroundSize: this.state.backgroundSize,
            width: this.state.width,
            height: this.state.height,
        };
    }

    getClassNames() {
        return classNames('sprite', this.uniqueID, super.getClassNames());
    }

    render() {
        return (
            <div
                {...this.props}
                className={this.getClassNames()}
                style={this.getContainerStyle()}
            >
                <skoash.Image
                    className="hidden"
                    src={this.image}
                />
                <div
                    ref="sprite"
                    className="view"
                    style={this.getStyle()}
                />
            </div>
        );
    }
}

Sprite.defaultProps = _.defaults({
    src: '',
    extension: 'png',
    dataExtension: 'json',
    duration: 1000,
    frame: 0,
    static: false,
    pause: false,
    loop: true,
    animateForwards: false,
    animateBackwards: false,
}, Component.defaultProps);

export default Sprite;
