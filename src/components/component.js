import classNames from 'classnames';

class Component extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            started: false,
            ready: false,
        };

        this.onReady = this.onReady || _.noop;

        this.start = _.throttle(this.start.bind(this), 100);
        this.ready = _.throttle(this.ready.bind(this), 100);
        this.complete = _.throttle(this.complete.bind(this), 100);
    }

    complete(props) {
        props = _.defaults(props || {}, this.props);
        setTimeout(() => {
            this.setState({
                complete: true,
            }, () => {
                skoash.trigger('complete');
                props.onComplete.call(this, this);
            });
        }, props.completeDelay);
    }

    incomplete() {
        if (!this.state.complete || this.props.complete) return;

        this.setState({
            complete: false,
        }, () => {
            skoash.trigger('incomplete');
            this.props.onIncomplete.call(this, this);
        });
    }

    completeRefs() {
        _.forEach(this.refs, ref => {
            _.invoke(ref, 'completeRefs');
        });

        this.complete({silent: true});
    }

    incompleteRefs() {
        _.forEach(this.refs, ref => {
            _.invoke(ref, 'incompleteRefs');
        });

        this.incomplete();
    }

    ready() {
        this.setState({
            ready: true,
        }, () => {
            if (this.props.triggerReady) skoash.trigger('ready');
            if (this.state.open) this.start();
            this.onReady.call(this);
            this.props.onReady.call(this);
        });
    }

    start(callback) {
        if (!this.state || !this.state.ready || this.state.started) return;
        this.setState({
            started: true
        }, () => {
            this.checkComplete();
            _.each(this.refs, ref => {
                _.invoke(ref, 'start');
            });

            if (this.props.completeOnStart) this.complete();

            this.props.onStart.call(this);

            if (typeof callback === 'function') callback.call(this);
        });
    }

    stop() {
        this.setState({
            started: false
        }, () => {
            _.each(this.refs, ref => {
                _.invoke(ref, 'stop');
            });

            this.props.onStop.call(this);
        });
    }

    pause() {
        _.each(this.refs, ref => {
            _.invoke(ref, 'pause');
        });

        this.props.onPause.call(this);
    }

    resume() {
        _.each(this.refs, ref => {
            _.invoke(ref, 'resume');
        });

        this.props.onResume.call(this);
    }

    open() {
        this.setState({
            open: true
        }, () => {
            this.props.onOpen.call(this);
        });
    }

    close() {
        this.setState({
            open: false
        }, () => {
            this.props.onClose.call(this);
        });
    }

    componentDidMount() {
        this.bootstrap();
    }

    bootstrap() {
        if (!this.props.bootstrap) return;

        if ((this.props.completeIncorrect && !this.props.correct) || this.props.complete) {
            this.complete();
        }

        this.collectMedia();
        this.checkReady();

        this.props.onBootstrap.call(this);
    }

    collectData() {
        return this.props.collectData.call(this);
    }

    loadData() {
        if (this.metaData) return this.props.loadData.call(this, this.metaData);
    }

    collectMedia() {
        this.media = {
            video: [],
            audio: {
                background: [],
                sfx: [],
                voiceOver: [],
            },
            sequence: [],
        };

        _.each(this.refs, (ref, key) => {
            if (ref instanceof skoash.Video) this.collectVideo(key);
            if (ref instanceof skoash.Audio) this.collectAudio(key);
            if (ref instanceof skoash.MediaSequence) this.collectMediaSequence(key);
        });
    }

    collectVideo(key) {
        if (!this.media[key]) this.media[key] = this.refs[key];
        if (!_.isFinite(key)) this.media.video[key] = this.refs[key];
        this.media.video.push(this.refs[key]);
    }

    collectAudio(key) {
        if (!this.media[key]) this.media[key] = this.refs[key];
        if (!this.media.audio[key]) this.media.audio[key] = this.refs[key];
        if (!_.isFinite(key)) {
            this.media.audio[this.refs[key].props.type][key] = this.refs[key];
        }
        if (this.refs[key].props.type) {
            this.media.audio[this.refs[key].props.type].push(this.refs[key]);
        }
    }

    collectMediaSequence(key) {
        if (!this.media[key]) this.media[key] = this.refs[key];
        if (!_.isFinite(key)) this.media.sequence[key] = this.refs[key];
        this.media.sequence.push(this.refs[key]);
    }

    playMedia(path) {
        _.invoke(this.media, path + '.play');
    }

    getUnready(ready = 'ready') {
        return _.reduce(this.refs, (a, v, k) => {
            if (v.state && !v.state[ready]) a[k] = v;
            return a;
        }, {});
    }

    checkReady() {
        var ready;

        if (!this.props.checkReady || (!this.props.ignoreReady && this.state.ready)) return;

        _.each(this.refs, ref => {
            if (!_.get(ref, 'state.ready')) _.invoke(ref, 'checkReady');
        });

        ready = !_.size(this.getUnready());

        if (ready) this.ready();
    }

    checkComplete() {
        var complete;

        if (!this.props.checkComplete || !this.state.ready) return;

        _.each(this.refs, ref => _.invoke(ref, 'checkComplete'));

        complete = !_.size(this.getUnready('complete'));

        if (complete && !this.state.complete) {
            this.complete();
        } else if (this.state.started && !complete && this.state.complete) {
            this.incomplete();
        }
    }

    updateGameState(opts) {
        return skoash.trigger('updateState', opts);
    }

    updateGameData(opts) {
        return skoash.trigger('updateGameData', opts);
    }

    updateScreenData(opts) {
        return skoash.trigger('updateScreenData', opts);
    }

    shouldComponentUpdate(nextProps, nextState) {
        return this.props.shouldComponentUpdate.call(this, nextProps, nextState);
    }

    componentWillReceiveProps(props) {
        if (props.complete === true && props.complete !== this.props.complete) {
            this.complete(props);
        }

        if (props.start === true && props.start !== this.props.start) {
            this.start();
        }

        if (props.stop === true && props.stop !== this.props.stop) {
            this.stop();
        }
    }

    addClassName(className) {
        if (this.state.className && this.state.className.indexOf(className) === -1) return;
        this.setState({
            className: classNames(this.state.className, className),
        });
    }

    removeClassName(className) {
        this.setState({
            className: this.state.className.replace(className, ''),
        });
    }

    removeAllClassNames() {
        this.setState({
            className: null
        });
    }

    getClassNames() {
        return classNames({
            READY: this.state.ready,
            STARTED: this.state.started,
            COMPLETE: this.state.complete,
            OPEN: this.state.open,
        }, this.state.className, this.props.className, this.props.getClassNames.call(this));
    }

    renderContentList(listName = 'children') {
        return _.map([].concat(this.props[listName]), (component, key) => {
            var gameState = component instanceof skoash.MediaSequence ? this.state : this.props.gameState;
            if (!component) return;
            return (
                <component.type
                    gameState={gameState}
                    {...component.props}
                    ref={component.ref || (component.props && component.props['data-ref']) ||
                        listName + '-' + key}
                    key={key}
                />
            );
        });
    }

    render() {
        if (!this.props.shouldRender) return null;

        return (
            <this.props.type {...this.props} className={this.getClassNames()}>
                {this.renderContentList()}
            </this.props.type>
        );
    }
}

Component.defaultProps = {
    bootstrap: true,
    checkComplete: true,
    checkReady: true,
    collectData: _.noop,
    completeDelay: 0,
    completeIncorrect: false,
    completeOnStart: false,
    getClassNames: _.noop,
    ignoreReady: false,
    loadData: _.noop,
    onBootstrap: _.noop,
    onClose: _.noop,
    onComplete: _.noop,
    onReady: _.noop,
    onIncomplete: _.noop,
    onOpen: _.noop,
    onPause: _.noop,
    onResume: _.noop,
    onStart: _.noop,
    onStop: _.noop,
    shouldComponentUpdate: () => true,
    shouldRender: true,
    triggerReady: true,
    type: 'div',
};

export default Component;
