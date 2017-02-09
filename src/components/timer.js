import classNames from 'classnames';

import Component from 'components/component';

class Timer extends Component {
    constructor(props) {
        super(props);

        this.state = {
            time: 0,
            stamp: 0
        };

        this.checkComplete = this.checkComplete.bind(this);
    }

    checkComplete() {
        var time = Date.now();

        if (!this.props.checkComplete) return;

        if (!this.state.started || this.state.paused) return;

        if (time >= this.state.stamp) {
            this.setState({
                stamp: time + 1000,
                time: this.state.time + 1000
            }, () => {
                if (this.state.time >= this.props.timeout) {
                    this.complete();
                    this.stop();
                } else {
                    if (typeof this.props.onCheckComplete === 'function') {
                        this.props.onCheckComplete.call(this);
                    }
                    window.requestAnimationFrame(this.checkComplete);
                }
                this.props.onIncrement.call(this);
            });
        } else {
            window.requestAnimationFrame(this.checkComplete);
        }
    }

    incompleteRefs() {
        this.restart();
    }

    restart() {
        if (!this.state.ready) return;
        if (this.state.complete) this.incomplete();

        this.setState({
            time: 0,
            stamp: 0,
        }, () => {
            if (this.state.started) {
                this.checkComplete();
            } else {
                this.start();
            }
        });
    }

    stop() {
        if (!this.state.started) return;
        this.setState({
            started: false
        });
    }

    pause() {
        if (!this.state.started) return;
        this.setState({
            paused: true
        });
    }

    resume(props = {}) {
        props = _.defaults(props, this.props);
        if (props.pause || !this.state.paused) return;
        this.setState({
            paused: false
        }, () => {
            if (this.state.started) {
                this.checkComplete();
            } else {
                this.start();
            }
        });
    }

    componentWillReceiveProps(props) {
        super.componentWillReceiveProps(props);

        if (props.restart && props.restart !== this.props.restart) {
            this.restart();
        }

        if (props.pause && props.pause !== this.props.pause) {
            this.pause();
        }

        if (props.resume && props.resume !== this.props.resume) {
            this.resume(props);
        }
    }

    getClassNames() {
        return classNames('timer', super.getClassNames());
    }

    render() {
        var time = this.props.getTime.call(this);
        return (
            <div {...this.props} className={this.getClassNames()} time={time}>
                {this.props.leadingContent}
                <span>
                    {time}
                </span>
                {this.props.children}
            </div>
        );
    }
}

Timer.defaultProps = _.defaults({
    getTime: function () {
        return moment(this.props.countDown ? this.props.timeout - this.state.time :
            this.state.time).format(this.props.format);
    },
    format: 'm:ss',
    leadingContent: '',
    timeout: 60000,
    countDown: false,
    onIncrement: _.noop,
}, Component.defaultProps);

export default Timer;
