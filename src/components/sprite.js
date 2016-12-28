import classNames from 'classnames';

import util from 'methods/util';
import Component from 'components/component';
import Image from 'components/image';

class Sprite extends Component {
    constructor(props) {
        super(props);

        this.state = _.defaults({
            frame: props.frame,
        }, this.state);

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
            util.loadJSON(`${props.src}.${props.dataExtension}`, data => {
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

        if (props.animate) {
            this.animate();
        } else if (props.animateBackwards) {
            this.animate(-1);
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
            top = 0;
            left = 0;
            backgroundPosition =
                `-${this.state.frame * width}px 0px`;
            backgroundSize =
                `${this.image.offsetWidth}px ${this.image.offsetHeight}px`;
            width = this.image.offsetWidth / props.frames;
            height = this.image.offsetHeight;
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
        if (this.props.hoverFrame != null) this.setUpHover(this.props);
    }

    setUpHover(props) {
        this.refs.view.addEventListener('mouseover', () => {
            this.setState({ frame: props.hoverFrame }, () => {
                this.update();
            });
        });

        this.refs.view.addEventListener('mouseout', () => {
            this.setState({ frame: props.frame }, () => {
                this.update();
            });
        });
    }

    ready() {
        if (this.data) super.ready();
    }

    animate(i = 1) {
        var now = Date.now();

        if (this.props.static || this.props.pause ||
            this.state.paused || !this.state.started) return;

        if (!this.props.loop) {
            if (this.props.animate) {
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

    pause() {
        super.pause();
        this.setState({ paused: true });
    }

    resume() {
        super.resume();
        this.setState({ paused: false }, () => {
            if (this.props.animate) this.animate();
            else if (this.props.animateBackwards) this.animate(-1);
        });
    }

    componentWillReceiveProps(props) {
        super.componentWillReceiveProps(props);

        if (props.src !== this.props.src || props.frames !== this.props.frames) {
            this.setUp(props);
        }

        if (props.frame !== this.props.frame) {
            this.setState({ frame: props.frame }, () => {
                this.update(props);
            });
        }

        if (props.animate) {
            this.animate();
        } else if (props.animateBackwards) {
            this.animate(-1);
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
        return classNames('sprite', super.getClassNames());
    }

    render() {
        return (
            <div
                {...this.props}
                className={this.getClassNames()}
                style={this.getContainerStyle()}
            >
                <Image
                    className="hidden"
                    ref="image"
                    src={this.image}
                />
                <div
                    ref="view"
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
    hoverFrame: null,
    static: false,
    pause: false,
    loop: true,
    animate: false,
    animateBackwards: false,
}, Component.defaultProps);

export default Sprite;
