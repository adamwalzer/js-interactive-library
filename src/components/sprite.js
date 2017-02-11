import classNames from 'classnames';

import Component from 'components/component';
import Image from 'components/image';
import JSON from 'components/json';

class Sprite extends Component {
    constructor(props) {
        super(props);

        this.state = _.defaults({
            frame: props.frame,
        }, this.state);

        this.lastAnimation = Date.now();

        this.onJSONReady = this.onJSONReady.bind(this);
    }

    onJSONReady() {
        this.data = this.refs.json.getData();
        this.setUp(this.props);
    }

    setUp(props) {
        let maxWidth;
        let maxHeight;
        let minX;
        let minY;

        this.image = `${props.src}.${props.extension}`;

        if (props.frames) {
            this.frames = props.frames;
            this.data = {};
            this.imageRef = ReactDOM.findDOMNode(this.refs.image);
            this.imageRef.onload = () => {
                this.checkReady();
                this.update(props);

                if (props.animate) {
                    this.animate();
                } else if (props.animateBackwards) {
                    this.animate(-1);
                }
            };
            this.imageRef.src = this.image;
        } else if (this.data && this.data.frames) {
            this.frames = this.data.frames.length;
            this.checkReady();
            this.update(props);

            minX = _.reduce(this.data.frames, (a, v) => Math.min(a, v.spriteSourceSize.x), Infinity);
            minY = _.reduce(this.data.frames, (a, v) => Math.min(a, v.spriteSourceSize.y), Infinity);
            maxWidth = _.reduce(this.data.frames, (a, v) =>
                Math.max(a, v.spriteSourceSize.x + v.spriteSourceSize.w - minX), 0);
            maxHeight = _.reduce(this.data.frames, (a, v) =>
                Math.max(a, v.spriteSourceSize.y + v.spriteSourceSize.h - minY), 0);

            this.setState({
                maxWidth,
                maxHeight,
                minX,
                minY,
            });

            if (props.animate) {
                this.animate();
            } else if (props.animateBackwards) {
                this.animate(-1);
            }
        }

        this.frameRates = [];

        if (_.isArray(props.duration)) {
            for (let i = 0; i < this.frames; i++) {
                this.frameRates.push(props.duration[i]);
            }
        } else {
            for (let i = 0; i < this.frames; i++) {
                this.frameRates.push(props.duration / this.frames);
            }
        }
    }

    update(props) {
        let styleTop;
        let styleLeft;
        let backgroundPosition;
        let backgroundSize;
        let width;
        let height;
        let maxWidth;
        let maxHeight;

        props = props || this.props;

        if (props.frames) {
            styleTop = 0;
            styleLeft = 0;
            width = this.imageRef.naturalWidth / props.frames;
            height = this.imageRef.naturalHeight;
            maxWidth = width;
            maxHeight = height;
            backgroundPosition =
                `-${this.state.frame * width}px 0px`;
            backgroundSize =
                `${this.imageRef.naturalWidth}px ${this.imageRef.naturalHeight}px`;
        } else if (this.data && this.data.frames) {
            this.frameData = this.data.frames[this.state.frame];
            styleTop = this.frameData.spriteSourceSize.y;
            styleLeft = this.frameData.spriteSourceSize.x;
            backgroundPosition =
                `-${this.frameData.frame.x}px -${this.frameData.frame.y}px`;
            backgroundSize =
                `${this.data.meta.size.w}px ${this.data.meta.size.h}px`;
            width = this.frameData.frame.w;
            height = this.frameData.frame.h;
            maxWidth = this.state.maxWidth;
            maxHeight = this.state.maxHeight;
        }

        this.setState({
            styleTop,
            styleLeft,
            backgroundPosition,
            backgroundSize,
            width,
            height,
            maxWidth,
            maxHeight,
        }, () => {
            props.onUpdate.call(this);
        });
    }

    bootstrap() {
        super.bootstrap();
        this.setUp(this.props);
        if (this.props.hoverFrame != null) this.setUpHover(this.props);
    }

    setUpHover(props) {
        this.refs.view.addEventListener('mouseover', () => {
            this.setState({ frame: props.hoverFrame }, () => {
                this.update(props);
            });
        });

        this.refs.view.addEventListener('mouseout', () => {
            this.setState({ frame: props.frame }, () => {
                this.update(props);
            });
        });
    }

    ready() {
        if (this.data) super.ready();
    }

    animate(i = 1) {
        const NOW = Date.now();
        let frame;

        if (this.props.static || this.props.pause ||
            this.state.paused || !this.state.started) return;

        if (!this.props.loop) {
            if (this.props.animateBackwards) {
                if (this.state.frame === 0) {
                    this.complete();
                    return;
                }
            }

            if (this.state.frame === this.frames - 1) {
                this.complete();
                return;
            }
        }

        if (NOW > this.lastAnimation + this.frameRates[this.state.frame]) {
            this.lastAnimation = NOW;
            frame = (this.state.frame + i + this.frames) % this.frames;
            if (frame === 0) this.props.onLoop.call(this);
            this.setState({
                frame
            }, () => {
                this.update(this.props);
            });
        }

        window.requestAnimationFrame(() => {
            this.animate(i);
        });
    }

    start() {
        super.start(() => {
            if (this.props.animate) this.animate();
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

        if (props.animate && props.animate !== this.props.animate) {
            this.animate();
        } else if (props.animateBackwards) {
            this.animate(-1);
        }
    }

    getContainerStyle() {
        let width;
        let height;

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
        let position;
        let styleTop;
        let styleLeft;

        if (!this.props.static) {
            position = 'absolute';
            styleTop = this.state.styleTop - this.state.minY || undefined;
            styleLeft = this.state.styleLeft - this.state.minX || undefined;
        }

        return _.defaults({
            position,
            top: styleTop,
            left: styleLeft,
            backgroundImage: `url(${this.props.src}.${this.props.extension})`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: this.state.backgroundPosition,
            backgroundSize: this.state.backgroundSize,
            width: this.state.width,
            height: this.state.height,
        }, this.props.style);
    }

    getClassNames() {
        return classNames('sprite', super.getClassNames());
    }

    renderJSON() {
        if (this.props.frames) return null;

        return (
            <JSON
                ref="json"
                src={`${this.props.src}.${this.props.dataExtension}`}
                onReady={this.onJSONReady}
            />
        );
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
                {this.renderJSON()}
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
    onLoop: _.noop,
    onUpdate: _.noop,
    style: {},
}, Component.defaultProps);

export default Sprite;
