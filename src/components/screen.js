import Component from 'components/component';

class Screen extends Component {
    constructor(props) {
        super(props);

        this.state = {
            ready: false,
            open: false,
            leaving: false,
            leave: false,
            close: true,
            complete: false,
            load: false,
        };

        this.next = this.next.bind(this);
        this.prev = this.prev.bind(this);
    }

    goto(index, buttonSound) {
        if (typeof index === 'string' || typeof index === 'number') {
            skoash.trigger('goto', {
                index,
                buttonSound
            });
        } else if (typeof index === 'object') {
            index.buttonSound = index.buttonSound || buttonSound;
            skoash.trigger('goto', index);
        }
    }

    back() {
        skoash.trigger('goBack');
    }

    next() {
        var state = this.props.gameState;

        if (!this.state.started || this.state.leaving ||
            (!state.demo && !this.state.complete && !this.state.replay)) return;

        this.setState({
            leaving: true
        });

        setTimeout(
            this.goto.bind(this, this.props.nextIndex || this.props.index + 1, this.media.audio.button),
            this.props.nextDelay || 0
        );
    }

    prev() {
        this.goto(this.props.prevIndex || this.props.index - 1);
    }

    load(cb) {
        this.onReadyCallback = cb;
        if (!this.state.load) {
            this.setState({
                load: true,
                ready: false,
                complete: false,
            }, () => {
                super.bootstrap();
                this.props.onLoad.call(this);
            });
        }
    }

    unload() {
        if (this.state.load && this.props.shouldUnload) {
            this.setState({
                load: false,
            }, () => {
                this.props.onUnload.call(this);
            });
        }
    }

    bootstrap() {
        super.bootstrap();

        if (this.props.load) this.load();
    }

    replay(replay = true) {
        this.load();
        this.setState({
            replay,
        });
    }

    start() {
        super.start(() => {
            this.bootstrap();
            this.startMedia();
        });
    }

    startMedia() {
        if (this.media.video[0]) {
            this.playMedia('video.0');
        } else if (this.media.audio.voiceOver[0]) {
            this.playMedia('audio.voiceOver.0');
        }

        this.playMedia('start');
        this.playMedia(this.props.playOnStart);
    }

    complete(opts = {}) {
        super.complete(opts);
        setTimeout(() => {
            skoash.trigger('screenComplete', {
                screenID: this.props.id,
                silent: opts.silent || this.props.silentComplete || this.media['screen-complete']
            });

            this.playMedia('screen-complete');

            if (this.props.emitOnComplete) {
                skoash.trigger('emit', this.props.emitOnComplete);
            }
        }, this.props.completeDelay);
    }

    open(opts) {
        var self = this;

        self.setState({
            load: true,
            open: true,
            opening: true,
            leaving: false,
            leave: false,
            close: false,
            replay: self.state.complete || self.state.replay,
            opts,
        }, () => {
            if (self.props.startDelay) {
                setTimeout(() => {
                    if (!self.state.started) self.start();
                    self.setState({
                        opening: false
                    });
                }, self.props.startDelay);
            } else {
                if (!self.state.started) self.start();
                self.setState({
                    opening: false
                });
            }

            self.props.onOpen.call(self);

            self.loadData();
        });
    }

    leave() {
        this.setState({
            open: false,
            leave: true,
            close: false,
        });
        this.stop();
    }

    close() {
        this.setState({
            open: false,
            leave: false,
            close: true,
        });
        this.stop();
    }

    collectData() {
        return this.props.collectData.call(this);
    }

    loadData() {
        return this.props.loadData.call(this);
    }

    renderContent() {
        if (!this.state.load) return null;
        return (
            <div className="screen-content">
                {this.renderContentList()}
            </div>
        );
    }

    renderPrevButton() {
        if (this.props.hidePrev) return null;
        return (
            <button className="prev-screen" onClick={this.prev} />
        );
    }

    renderNextButton() {
        if (this.props.hideNext) return null;
        return (
            <button className="next-screen" onClick={this.next} />
        );
    }

    render() {
        return (
            <div id={this.props.id} className={this.getClassNames()}>
                {this.renderContent()}
                {this.renderPrevButton()}
                {this.renderNextButton()}
            </div>
        );
    }
}

Screen.defaultProps = _.defaults({
    componentName: 'screen',
    resetOnClose: true,
    startDelay: 250,
    collectData: _.noop,
    loadData: _.noop,
    onOpen: _.noop,
    onLoad: _.noop,
    onUnload: _.noop,
    shouldUnload: true,
    gameState: {},
}, Component.defaultProps);

export default Screen;
