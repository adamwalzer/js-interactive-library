import Component from 'components/component';

class GameEmbedder extends Component {
    constructor(props) {
        super(props);

        this.respond = this.respond.bind(this);
        this.onLoad = this.onLoad.bind(this);
    }

    bootstrap() {
        super.bootstrap();

        this.gameNode = ReactDOM.findDOMNode(this.refs.game);
        this.gameNode.addEventListener('game-event', this.respond);
    }

    respond(opts) {
        if (opts.ready) {
            this.phaserReady();
        } else if (opts.complete) {
            this.complete();
        } else if (opts.updateGameState) {
            // remove this once updateGameState is removed from the Game Component
            this.updateGameState(opts.updateGameState);
        } else if (opts.updateGameData) {
            this.updateGameData(opts.updateGameData);
        } else if (opts.updateScreenData) {
            this.updateScreenData(opts.updateScreenData);
        }

        this.props.onRespond.call(this, opts);
    }

    phaserReady() {
        this.setState({
            phaserReady: true,
        });
    }

    onLoad() {
        this.emitEvent({
            name: 'focus',
        });

        this.setState({
            loaded: true,
        }, () => {
            this.props.onLoad.call(this);
        });
    }

    pause() {
        super.pause();
        this.emitEvent({ name: 'pause' });
    }

    resume(force = false) {
        if (this.props.pause && !force) return;
        super.resume();
        this.emitEvent({ name: 'resume' });
    }

    emitEvent(data) {
        var e = new Event('skoash-event');

        if (!this.state.loaded || !this.state.phaserReady) return;

        e.name = data.name;
        e.data = data;
        this.gameNode.contentWindow.dispatchEvent(e);
    }

    componentWillReceiveProps(props) {
        super.componentWillReceiveProps(props);

        if (props.controller) {
            this.emitEvent({
                name: 'controller-update',
                controller: props.controller,
            });
        }

        if (props.data) {
            this.emitEvent({
                name: 'data-update',
                data: props.data,
            });
        }

        if (props.pause && props.pause !== this.props.pause) {
            this.pause();
        }

        if (props.resume && props.resume !== this.props.resume) {
            this.resume(true);
        }
    }

    getStyle() {
        return _.defaults({}, this.props.style, {
            pointerEvents: 'none',
        });
    }

    render() {
        return (
            <iframe
                {...this.props}
                ref="game"
                onLoad={this.onLoad}
                style={this.getStyle()}
            />
        );
    }
}

GameEmbedder.defaultProps = _.defaults({
    complete: false,
    checkComplete: false,
    onLoad: _.noop,
    onRespond: _.noop,
}, Component.defaultProps);

export default GameEmbedder;
