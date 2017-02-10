// AJW 20161115
// Howler 2.0.1 is out. Perhaps we should give it a try.
import { Howl } from 'howler';
import Media from './media.js';

class Audio extends Media {
    constructor(props) {
        super(props);

        this.startCount = 0;
        this.completeCount = 0;
        this.allowMultiPlay = props.allowMultiPlay || props.type === 'sfx';

        this.playAudio = this.playAudio.bind(this);
        this.play = _.throttle(this.play.bind(this), props.playThrottle);
    }

    play() {
        skoash.trigger('getState').then(state => {
            if (!this.state.ready) {
                this.bootstrap();
            } else {
                skoash.trigger('audioPlay', {
                    audio: this
                });
                this.delayed = true;

                if (!state.paused) {
                    this.timeout = setTimeout(this.playAudio, this.props.delay);
                }
            }
        });
    }

    playAudio(resume) {
        if (this.paused) return;
        if (!resume && !this.allowMultiPlay && this.playing) return;

        this.delayed = false;
        this.playing = true;

        this.audio.play(this.sprite);
        this.startCount++;
        super.play();
    }

    pause() {
        if (this.delayed) {
            clearTimeout(this.timeout);
        }

        if (!this.playing) return;
        this.audio.pause();
        this.paused = true;
    }

    resume() {
        skoash.trigger('getState').then(state => {
            if (state.paused) return;

            if (this.delayed) {
                this.timeout = setTimeout(
          this.playAudio,
          this.props.delay
        );
            }

            if (!this.paused) return;
            this.paused = false;
            this.playAudio(true);
        });
    }

    stop() {
        if (this.delayed && this.timeout) {
            clearTimeout(this.timeout);
        }

        if (!this.playing && !this.delayed) return;
        if (!this.audio) return;

        skoash.trigger('audioStop', {
            audio: this
        });
        this.playing = false;
        this.paused = false;
        this.audio.stop(this.sprite);
    }

    setVolume(volume) {
        volume = Math.min(this.props.maxVolume,
            Math.max(this.props.minVolume, volume));
        this.audio.volume(volume);
    }

    increaseVolume(volume) {
        if (!this.playing) return;
        volume = Math.min(volume || this.props.volume, this.props.maxVolume);
        this.audio.fadeIn(volume);
    }

    decreaseVolume(volume) {
        if (!this.playing) return;
        volume = Math.max(volume, this.props.minVolume);
        this.audio.fadeOut(volume);
    }

    complete(props) {
        props = _.defaults(props || {}, this.props);

        if (!props.loop) {
            skoash.trigger('audioStop', {
                audio: this
            });
        }

        this.completeCount++;

        if (!props.complete && (!this.playing || this.paused)) return;
        if (this.startCount > this.completeCount) return;

        if (!props.loop) this.playing = false;
        super.complete();
    }

    bootstrap() {
        var sprite;

        this.sprite = this.props.sprite ? 'sprite' : undefined;

        if (this.audio) return;

        if (this.props.sprite) {
            sprite = {
                sprite: this.props.sprite
            };
        }

        this.audio = new Howl({
            // switch urls to src when moving to Howler ^2.0.0
            urls: [].concat(this.props.src),
            format: [].concat(this.props.format),
            loop: this.props.loop,
            volume: this.props.volume,
            onend: this.complete,
            onload: this.ready,
            rate: this.props.rate,
            sprite,
        });

        if (this.props.complete) this.complete();
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.volume !== null && nextProps.volume !== this.props.volume) {
            this.setVolume(nextProps.volume);
        }
    }
}

Audio.defaultProps = _.defaults({
    type: 'sfx',
    format: 'mp3',
    delay: 0,
    rate: 1,
    loop: false,
    volume: 1,
    maxVolume: 1,
    minVolume: 0,
    playThrottle: 100,
    shouldRender: false,
    sprite: undefined,
    allowMultiPlay: false,
}, Media.defaultProps);

export default Audio;
