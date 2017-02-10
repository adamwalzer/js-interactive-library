import classNames from 'classnames';
import shortid from 'shortid';

import Component from 'components/component';

class SpriteAnimation extends Component {
    constructor(props) {
        super(props);

        this.uniqueID = shortid(Math.random());
        this.sprite = {};

        /* eslint-disable no-console */
        console.warn('Consider switching to skoash.Sprite as SpriteAnimation will soon be deprecated.');
        /* eslint-enable no-console */
    }

    onReady() {
        this.sprite = ReactDOM.findDOMNode(this.refs.sprite);
    }

    start() {
        super.start();
        if (this.props.animateOnStart) this.animate();
    }

    animate(animate = true) {
        this.setState({
            animate
        });
    }

    componentWillReceiveProps(props) {
        super.componentWillReceiveProps(props);

        if (props.animate !== this.props.animate) {
            this.animate(props.animate);
        }
    }

    getStyle() {
        var animation = `${this.uniqueID}${this.state.animate ? '' : '-back'} ` +
      `${this.props.duration}s steps(${this.props.frames - 1}) forwards`;

        return {
            backgroundImage: `url(${this.props.src})`,
            backgroundSize: `${this.sprite.offsetWidth * this.props.frames}px`,
            WebkitAnimation: animation,
            animation,
        };
    }

    getClassNames() {
        return classNames('sprite-animation', {
            ANIMATE: this.state.animate,
        }, this.uniqueID, super.getClassNames());
    }

    render() {
        return (
            <div>
                <style>
                    {
                        `@keyframes ${this.uniqueID} {\n` +
                        '    0% {\n' +
                        '        background-position: 0px center;\n' +
                        '    }\n' +
                        '    100% {\n' +
                        '        background-position: -' +
                            `${this.sprite.offsetWidth * (this.props.frames - 1)}px center;\n` +
                        '    }\n' +
                        '}\n' +
                        `@keyframes ${this.uniqueID}-back {\n` +
                        '    0% {\n' +
                        '        background-position: -' +
                            `${this.sprite.offsetWidth * (this.props.frames - 1)}px center;\n` +
                        '    }\n' +
                        '    100% {\n' +
                        '        background-position: 0px center;\n' +
                        '    }\n' +
                        '}\n'
                    }
                </style>
                <div
                    {...this.props}
                    ref="sprite"
                    className={this.getClassNames()}
                    style={this.getStyle()}
                />
            </div>
        );
    }
}

SpriteAnimation.defaultProps = _.defaults({
    animateOnStart: true,
    src: '',
    frames: 1,
    duration: 1,
}, Component.defaultProps);

export default SpriteAnimation;
