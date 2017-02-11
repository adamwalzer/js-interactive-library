import Media from './media.js';

class Video extends Media {
    constructor(props) {
        super(props);

        this.play = this.play.bind(this);
    }

    play() {
        if (this.playing && !this.paused) return;
        /*
        * In order for videos to play on mobile devices,
        * the screen must have prop.startDelay=0
        */
        this.video.play();
        super.play();
        skoash.trigger('videoPlay', {
            video: this
        });
        this.playing = true;
        this.paused = false;
    }

    start() {
        this.play();
    }

    stop() {
        this.video.pause();
        skoash.trigger('videoStop', {
            video: this
        });
        this.playing = false;
    }

    pause() {
        this.video.pause();
        this.paused = true;
    }

    resume() {
        this.play();
    }

    complete() {
        if (!this.props.loop) {
            skoash.trigger('videoStop', {
                video: this
            });
        }

        this.playing = false;

        super.complete();
    }

    bootstrap() {
        this.video = ReactDOM.findDOMNode(this);
    }

    render() {
        return (
            <video
                {...this.props}
                onCanPlay={this.ready}
                onEnded={this.complete}
                preload="auto"
                controls={true}
            />
        );
    }
}

export default Video;
