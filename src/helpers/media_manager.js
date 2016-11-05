var mediaManager = {
  audioPlay(opts) {
    var playingSFX, playingVO, playingBKG, classes;

    playingSFX = this.state.playingSFX || [];
    playingVO = this.state.playingVO || [];
    playingBKG = this.state.playingBKG || [];
    classes = this.state.classes || [];

    if (opts.audio.props.gameClass) {
      classes.push(opts.audio.props.gameClass);
    }

    switch (opts.audio.props.type) {
    case 'sfx':
      playingSFX.push(opts.audio);
      break;
    case 'voiceOver':
      playingVO.push(opts.audio);
      mediaManager.fadeBackground.call(this);
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
  },

  audioStop(opts) {
    var playingSFX, playingVO, playingBKG, index;

    playingSFX = this.state.playingSFX || [];
    playingVO = this.state.playingVO || [];
    playingBKG = this.state.playingBKG || [];

    switch (opts.audio.props.type) {
    case 'sfx':
      index = playingSFX.indexOf(opts.audio);
      index !== -1 && playingSFX.splice(index, 1);
      break;
    case 'voiceOver':
      index = playingVO.indexOf(opts.audio);
      index !== -1 && playingVO.splice(index, 1);
      if (!playingVO.length) {
        mediaManager.raiseBackground.call(this);
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
  },

  videoPlay(opts) {
    var playingVideo = this.state.playingVideo;

    if (playingVideo) {
      playingVideo.stop();
    }

    playingVideo = opts.video;

    mediaManager.fadeBackground.call(this, 0);

    this.setState({
      playingVideo,
    });
  },

  videoStop() {
    mediaManager.raiseBackground.call(this, 1);

    this.setState({
      playingVideo: null,
    });
  },

  fadeBackground(value = .25) {
    _.forEach(this.state.playingBKG, bkg => {
      bkg.setVolume(value);
    });
  },

  raiseBackground(value = 1) {
    if (this.state.playingVO.length === 0 && !this.state.playingVideo) {
      _.forEach(this.state.playingBKG, bkg => {
        bkg.setVolume(value);
      });
    }
  },

  playBackground(currentScreenIndex, currentScreenID) {
    var index, playingBKG, currentScreen;

    if (!_.isFinite(currentScreenIndex)) return;

    // re-factor to index = this.props.getBackgroundIndex.call(this, index);
    // after games that override it have be re-factored
    // all-about-you, polar-bear, tag-it
    index = this.getBackgroundIndex(currentScreenIndex, currentScreenID);
    playingBKG = this.state.playingBKG;

    currentScreen = this.refs['screen-' + currentScreenIndex];

    if (!currentScreen.props.restartBackground &&
      playingBKG.indexOf(this.audio.background[index]) !== -1) {
      return;
    }

    _.each(playingBKG, bkg => {
      bkg.stop();
    });

    if (this.audio.background[index]) {
      this.audio.background[index].play();
    }
  },
};

export default mediaManager;
