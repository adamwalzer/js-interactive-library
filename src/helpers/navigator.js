class Navigator {
  constructor(game) {
    this.goto = this.goto.bind(game);
    this.shouldGoto = this.shouldGoto.bind(game);
    this.openNewScreen = this.openNewScreen.bind(game);
    this.closeOldScreen = this.closeOldScreen.bind(game);
    this.goBack = this.goBack.bind(game);
    this.openMenu = this.openMenu.bind(game);
    this.menuClose = this.menuClose.bind(game);
  }

  goto(opts) {
    /*
     * highestScreenIndex is the index of the highest screen reached
     * not the index of the highest screen that exists.
     */
    var oldScreen, prevScreen, oldIndex, currentScreenIndex, newScreen, nextScreen,
      highestScreenIndex, screenIndexArray, data;

    opts = this.props.getGotoOpts.call(this, opts);

    oldIndex = this.state.currentScreenIndex;
    oldScreen = this.refs['screen-' + oldIndex];

    if (typeof opts.index === 'number') {
      if (opts.index > this.screensLength - 1) {
        return this.quit();
      }
      currentScreenIndex = Math.min(this.screensLength - 1, Math.max(0, opts.index));
      highestScreenIndex = Math.max(this.state.highestScreenIndex, currentScreenIndex);
      nextScreen = this.refs['screen-' + (currentScreenIndex + 1)];
      prevScreen = this.refs['screen-' + (currentScreenIndex - 1)];
    } else if (typeof opts.index === 'string') {
      currentScreenIndex = opts.index;
      highestScreenIndex = this.state.highestScreenIndex;
    }

    newScreen = this.refs['screen-' + currentScreenIndex];

    if (!this.navigator.shouldGoto(oldScreen, newScreen, opts)) return;

    data = this.navigator.closeOldScreen(oldScreen, newScreen, opts, oldIndex);
    screenIndexArray = this.navigator.openNewScreen(newScreen, currentScreenIndex, opts);

    _.invoke(prevScreen, 'replay');
    _.invoke(nextScreen, 'load');
    if (!opts.load) this.eventManager.emitSave(highestScreenIndex, currentScreenIndex);
    this.mediaManager.playBackground(currentScreenIndex, newScreen.props.id);

    this.setState({
      loading: false,
      currentScreenIndex,
      highestScreenIndex,
      screenIndexArray,
      classes: [],
      data,
    });
  }

  shouldGoto(oldScreen, newScreen, opts) {
    return !(
      (!opts.load && oldScreen && oldScreen.state && oldScreen.state.opening) ||
      (oldScreen.props.index < newScreen.props.index && !opts.load && !this.state.demo &&
        !(oldScreen.state.complete || oldScreen.state.replay)) ||
      (oldScreen.props.index > newScreen.props.index && newScreen.props.index === 0)
    );
  }

  openNewScreen(newScreen, currentScreenIndex, opts) {
    var screenIndexArray = this.state.screenIndexArray;
    if (newScreen) {
      // this should only be dropped into for non-linear screens
      if (!newScreen.state.load || !newScreen.state.ready) {
        this.loadScreens(currentScreenIndex, false);
      }
      screenIndexArray.push(currentScreenIndex);
      newScreen.open(opts);
    }
    return screenIndexArray;
  }

  closeOldScreen(oldScreen, newScreen, opts, oldIndex) {
    var back, buttonSound, data = _.cloneDeep(this.state.data);
    if (oldScreen && oldScreen !== newScreen) {
      if (oldScreen.props.index > newScreen.props.index) {
        back = true;
        oldScreen.close();
      } else {
        oldScreen.leave();
      }

      if (!opts.silent) {
        if (opts.buttonSound && typeof opts.buttonSound.play === 'function') {
          buttonSound = opts.buttonSound;
        } else if (this.media.audio.button) {
          buttonSound = this.media.audio.next || this.media.audio.button;
          if (back) buttonSound = this.media.audio.back || this.media.audio.button;
        }
        if (buttonSound) buttonSound.play();
      }

      if (oldScreen.props.resetOnClose) {
        data.screens[oldIndex] = {};
      }
    }
    return data;
  }

  goBack() {
    var screenIndexArray, index;
    screenIndexArray = this.state.screenIndexArray;
    screenIndexArray.pop();
    index = screenIndexArray.pop();

    this.navigator.goto({index});
  }

  openMenu(opts) {
    var menu, openMenus;

    menu = this.refs['menu-' + opts.id];

    if (menu) {
      menu.open();
      openMenus = this.state.openMenus || [];
      openMenus.push(opts.id);
      this.playMedia('button');
      this.setState({
        openMenus,
      });
    }

    _.invoke(this.refs['screen-' + this.state.currentScreenIndex], 'pause');
  }

  menuClose(opts) {
    var menu, openMenus;

    menu = this.refs['menu-' + opts.id];

    if (menu) {
      menu.close();
      openMenus = this.state.openMenus || [];
      openMenus.splice(opts.id, 1);
      this.playMedia('button');
      this.setState({
        openMenus,
      });
    }

    if (!openMenus.length) {
      _.invoke(this.refs['screen-' + this.state.currentScreenIndex], 'resume');
    }
  }
}

export default Navigator;
