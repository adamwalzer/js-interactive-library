class MediaManager {
    constructor(game) {
        this.audioPlay = this.audioPlay.bind(game);
        this.audioStop = this.audioStop.bind(game);
        this.videoPlay = this.videoPlay.bind(game);
        this.videoStop = this.videoStop.bind(game);
        this.fadeBackground = this.fadeBackground.bind(game);
        this.raiseBackground = this.raiseBackground.bind(game);
        this.playBackground = this.playBackground.bind(game);
    }

    audioPlay(opts) {
        var playingSFX = this.state.playingSFX || [];
        var playingVO = this.state.playingVO || [];
        var playingBKG = this.state.playingBKG || [];
        var classes = this.state.classes || [];

        if (opts.audio.props.gameClass) {
            classes.push(opts.audio.props.gameClass);
        }

        switch (opts.audio.props.type) {
            case 'sfx':
                playingSFX.push(opts.audio);
                break;
            case 'voiceOver':
                playingVO.push(opts.audio);
                this.mediaManager.fadeBackground();
                break;
            case 'background':
                playingBKG.push(opts.audio);
                break;
        }

        this.setState({
            playingSFX,
            playingVO,
            playingBKG,
            classes
        });
    }

    audioStop(opts) {
        var playingSFX = this.state.playingSFX || [];
        var playingVO = this.state.playingVO || [];
        var playingBKG = this.state.playingBKG || [];
        var index;

        switch (opts.audio.props.type) {
            case 'sfx':
                index = playingSFX.indexOf(opts.audio);
                index !== -1 && playingSFX.splice(index, 1);
                break;
            case 'voiceOver':
                index = playingVO.indexOf(opts.audio);
                index !== -1 && playingVO.splice(index, 1);
                if (!playingVO.length) {
                    this.mediaManager.raiseBackground();
                }
                break;
            case 'background':
                index = playingBKG.indexOf(opts.audio);
                index !== -1 && playingBKG.splice(index, 1);
                break;
        }

        this.setState({
            playingSFX,
            playingVO,
            playingBKG,
        });
    }

    videoPlay(opts) {
        var playingVideo = this.state.playingVideo;

        if (playingVideo) playingVideo.stop();

        playingVideo = opts.video;

        this.mediaManager.fadeBackground(0);

        this.setState({
            playingVideo,
        });
    }

    videoStop() {
        this.mediaManager.raiseBackground(1);

        this.setState({
            playingVideo: null,
        });
    }

    fadeBackground(value = .25) {
        _.each(this.state.playingBKG, bkg => _.invoke(bkg, 'setVolume', value));
    }

    raiseBackground(value = 1) {
        if (this.state.playingVO.length === 0 && !this.state.playingVideo) {
            _.each(this.state.playingBKG, bkg => _.invoke(bkg, 'setVolume', value));
        }
    }

    playBackground(currentScreenIndex, currentScreenID, backgroundIndex) {
        var index;
        var playingBKG;
        var currentScreen;

        // re-factor to index = this.props.getBackgroundIndex.call(this, index);
        // after games that override it have been re-factored
        // all-about-you, polar-bear
        index = _.defaultTo(backgroundIndex, this.getBackgroundIndex(currentScreenIndex, currentScreenID));

        if (index == null) return;

        playingBKG = this.state.playingBKG;

        currentScreen = this.refs['screen-' + currentScreenIndex];

        if (!currentScreen.props.restartBackground &&
            playingBKG.indexOf(this.media.audio.background[index]) !== -1) {
            return;
        }

        _.each(playingBKG, bkg => _.invoke(bkg, 'stop'));

        this.playMedia('audio.background.' + index);
    }
}

export default MediaManager;
