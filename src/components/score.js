import classNames from 'classnames';

import Component from 'components/component';

class Score extends Component {
    constructor(props) {
        super(props);

        this.state = {
            score: 0
        };

        this.checkComplete = this.checkComplete.bind(this);
    }

    checkComplete() {
        if (!this.props.checkComplete || !this.state.ready) return;
        if (!_.isFinite(this.props.max)) return;
        if ((this.state.score >= this.props.max || this.props.correct >= this.props.max) &&
            !this.state.complete) this.complete();
    }

    bootstrap() {
        super.bootstrap();

        this.setState({
            score: this.props.startingScore
        });
    }

    complete() {
        super.complete();

        setTimeout(() => {
            if (this.props.resetOnComplete) {
                this.setScore({
                    correct: 0,
                    incorrect: 0,
                });
            }
        }, this.props.completeDelay);
    }

    checkScore(props) {
        if (!_.isFinite(props.max)) return;
        if (this.state.score >= props.max && (!this.state.complete || props.multipleCompletes)) {
            this.complete();
        } else if (this.state.complete && !props.complete) {
            this.incomplete();
        }
    }

    up(increment) {
        increment = _.isFinite(increment) ? increment : _.isFinite(this.props.increment) ?
            this.props.increment : 1;
        if (!_.isFinite(increment)) throw 'increment must be finite';

        this.updateScore(increment);
    }

    down(increment) {
        increment = _.isFinite(increment) ? increment : _.isFinite(this.props.downIncrement) ?
            this.props.downIncrement : _.isFinite(this.props.increment) ? this.props.increment : 1;
        if (!_.isFinite(increment)) throw 'increment must be finite';

        this.updateScore(-1 * increment);
    }

    updateScore(increment) {
        this.setState({
            score: this.state.score + increment
        }, () => {
            this.updateScreenData({
                key: this.props.dataTarget,
                data: {
                    score: this.state.score
                }
            });

            this.checkScore(this.props);
            this.props.onUpdateScore.call(this, this.state.score);
        });
    }

    setScore(props) {
        var upIncrement;
        var downIncrement;
        var score;

        if (_.isFinite(props)) {
            score = props;
        } else {
            upIncrement = _.isFinite(props.increment) ? props.increment : 1;
            downIncrement = _.isFinite(props.downIncrement) ? props.downIncrement :
                _.isFinite(props.increment) ? props.increment : 1;
            score = upIncrement * props.correct - downIncrement * props.incorrect;
        }

        this.setState({
            score
        }, () => {
            this.checkScore(props);
            this.props.onUpdateScore.call(this, score);
        });
    }

    componentWillReceiveProps(props) {
        super.componentWillReceiveProps(props);

        if (props.setScore ||
            props.correct !== this.props.correct ||
            props.incorrect !== this.props.incorrect) {
            this.setScore(props);
        }
    }

    getClassNames() {
        return classNames(
      'score',
      `score-${this.state.score}`,
      super.getClassNames()
    );
    }

    render() {
        return (
            <div
                {...this.props}
                className={this.getClassNames()}
                data-max={this.props.max}
                data-score={this.state.score}
                score={this.state.score}
            >
                {this.props.leadingContent}
                <span>
                    {this.state.score}
                </span>
                {this.props.children}
            </div>
        );
    }
}

Score.defaultProps = _.defaults({
    checkComplete: false,
    startingScore: 0,
    correct: 0,
    incorrect: 0,
    setScore: false,
    onUpdateScore: _.noop,
}, Component.defaultProps);

export default Score;
