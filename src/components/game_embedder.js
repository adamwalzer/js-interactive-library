import Component from 'components/component';

class GameEmbedder extends Component {
    constructor() {
        super();

        this.respond = this.respond.bind(this);
        this.onLoad = this.onLoad.bind(this);
    }

    bootstrap() {
        super.bootstrap();

        this.gameNode = ReactDOM.findDOMNode(this.refs.game);
        this.gameNode.addEventListener('game-event', this.respond);
    }

    respond(opts) {
        if (opts.complete) {
            this.complete();
        } else if (opts.updateGameState) {
            this.updateGameState(opts.updateGameState);
        }

        this.props.onRespond.call(this, opts);
    }

    onLoad() {
        this.emitEvent({
            name: 'focus',
        });

        this.props.onLoad.call(this);
    }

    pause() {
        super.pause();
        this.emitEvent({ name: 'pause' });
    }

    resume(force) {
        if (this.props.pause && !force) return;
        super.resume();
        this.emitEvent({ name: 'resume' });
    }

    emitEvent(data) {
        var e = new Event('skoash-event');
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

    render() {
        return (
            <iframe
                {...this.props}
                ref="game"
                onLoad={this.onLoad}
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
