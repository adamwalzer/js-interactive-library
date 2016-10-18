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
};

export default mediaManager;
