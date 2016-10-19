import classNames from 'classnames';

import attachEvents from 'helpers/attach_events';
import deviceDetector from 'helpers/device_detector';
import mediaManager from 'helpers/media_manager';

import Component from 'components/component';
import Screen from 'components/screen';

class Game extends Component {
  constructor(props = {}) {
    super();

    this.config = props.config ? props.config : props;

    this.screens = props.screens || {
      0: <Screen />
    };

    this.menus = props.menus || {
      Screen
    };

    this.state = {
      currentScreenIndex: 0,
      highestScreenIndex: 0,
      screenIndexArray: [],
      playingSFX: [],
      playingVO: [],
      playingBKG: [],
      playingVideo: null,
      openMenus: [],
      loading: true,
      demo: false,
      data: {},
      classes: [],
    };

    this.state.data.screens = _.map(this.screens, () => ({}));

    attachEvents.call(this);
  }

  getState(opts = {}) {
    if (typeof opts.respond === 'function') opts.respond(this.state);
  }

  demo() {
    var demo = !this.state.demo;
    this.setState({
      demo
    });
  }

  onKeyDown(e) {
    if (e.keyCode === 78) { // n for next
      this.goto({index: this.state.currentScreenIndex + 1});
    } else if (e.keyCode === 66) { // b for back
      this.goto({index: this.state.currentScreenIndex - 1});
    } else if (e.altKey && e.ctrlKey && e.keyCode === 68) { // alt + ctrl + d
      this.demo();
    }
  }

  componentWillMount() {
    this.emit({
      name: 'init',
    });
    deviceDetector.detechDevice.call(this);
    this.scale();
  }

  bootstrap() {
    var self = this;

    if (!self.state.iOS) {
      self.state.currentScreenIndex = 1;
    }

    self.requireForReady = Object.keys(self.refs);
    self.requireForComplete = self.requireForReady.filter(key => {
      return !self.refs[key].state || !self.refs[key].state.complete;
    });

    self.collectMedia();
    self.loadScreens(self.state.currentScreenIndex, false);

    self.DOMNode = ReactDOM.findDOMNode(self);

    self.props.onBootstrap.call(self);
  }

  loadScreens(currentScreenIndex, goto = true) {
    var firstScreen, secondScreen;

    if (!_.isFinite(currentScreenIndex)) currentScreenIndex = this.state.currentScreenIndex;

    firstScreen = this.refs['screen-' + currentScreenIndex];
    secondScreen = this.refs['screen-' + currentScreenIndex + 1];

    if (firstScreen) {
      firstScreen.load(() => {
        this.checkReady();

        if (goto) {
          this.goto({
            index: currentScreenIndex,
            load: true,
            silent: true,
          });
        }
      });
    }
    if (secondScreen) secondScreen.load();
  }

  ready() {
    if (!this.state.ready) {
      this.setState({
        ready: true,
      }, () => {
        this.emit({
          name: 'ready',
          game: this.config.id,
        });
        this.goto({
          index: this.state.currentScreenIndex,
          silent: true,
        });
      });
    }
  }

  resume() {
    if (this.state.playingVO.length) {
      mediaManager.fadeBackground.call(this);
    }
    this.setPause(false);
  }

  pause() {
    this.setPause(true);
  }

  // paused should be a boolean determining if whether to call
  // audio.pause or audio.resume
  setPause(paused) {
    var openScreen, fnKey = paused ? 'pause' : 'resume';

    this.setState({
      paused
    }, () => {
      _.forEach(this.state.playingBKG, audio => {
        audio[fnKey]();
      });

      openScreen = this.refs['screen-' + this.state.currentScreenIndex];
      if (openScreen && typeof openScreen[fnKey] === 'function') {
        openScreen[fnKey]();
      }
    });
  }

  goBack() {
    var screenIndexArray, index;
    screenIndexArray = this.state.screenIndexArray;
    screenIndexArray.pop();
    index = screenIndexArray.pop();

    this.goto({index});
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

    if (!this.shouldGoto(oldScreen, newScreen, opts)) return;

    screenIndexArray = this.openNewScreen(newScreen, currentScreenIndex, opts);
    data = this.closeOldScreen(oldScreen, newScreen, opts, oldIndex);

    if (prevScreen) prevScreen.replay();
    if (nextScreen) nextScreen.load();
    if (!opts.load) this.emitSave(highestScreenIndex, currentScreenIndex);
    mediaManager.playBackground.call(this, currentScreenIndex);

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
    if (!opts.load && oldScreen && oldScreen.state && oldScreen.state.opening) {
      return false;
    }

    if (oldScreen.props.index < newScreen.props.index) {
      if (!opts.load && !this.state.demo && !(oldScreen.state.complete || oldScreen.state.replay)) {
        return false;
      }
    }

    if (oldScreen.props.index > newScreen.props.index) {
      if (newScreen.props.index === 0) {
        return false;
      }
    }

    return true;
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
        } else if (this.audio.button) {
          buttonSound = this.audio.next || this.audio.button;
          if (back) buttonSound = this.audio.back || this.audio.button;
        }
        if (buttonSound) buttonSound.play();
      }

      if (oldScreen.props.resetOnClose) {
        data.screens[oldIndex] = {};
      }
    }
    return data;
  }

  emitSave(highestScreenIndex, currentScreenIndex) {
    if (highestScreenIndex < 2) return;
    this.emit({
      name: 'save',
      game: this.config.id,
      version: this.config.version,
      highestScreenIndex,
      currentScreenIndex,
    });
  }

  openMenu(opts) {
    var menu, openMenus, screen;

    menu = this.refs['menu-' + opts.id];

    if (menu) {
      menu.open();
      openMenus = this.state.openMenus || [];
      openMenus.push(opts.id);
      if (this.media.button) this.media.button.play();
      this.setState({
        openMenus,
      });
    }

    screen = this.refs['screen-' + this.state.currentScreenIndex];
    if (screen) screen.pause();
  }

  menuClose(opts) {
    var openMenus, screen;

    openMenus = this.state.openMenus || [];
    openMenus.splice(opts.id, 1);
    if (this.media.button) this.media.button.play();
    this.setState({
      openMenus,
    });

    screen = this.refs['screen-' + this.state.currentScreenIndex];
    if (screen && !openMenus.length) screen.resume();
  }

  // Remove this method after refactoring games that override it.
  // all-about-you, polar-bear, tag-it
  getBackgroundIndex(index) {
    return this.props.getBackgroundIndex.call(this, index);
  }

  scale() {
    this.setState({
      scale: window.innerWidth / this.config.dimensions.width,
    });
  }

  trigger(event, opts) {
    var events, fn;

    events = {
      goto: this.goto,
      goBack: this.goBack,
      audioPlay: mediaManager.audioPlay,
      audioStop: mediaManager.audioStop,
      videoPlay: mediaManager.videoPlay,
      videoStop: mediaManager.videoStop,
      demo: this.demo,
      'toggle-demo-mode': this.demo,
      getData: this.getData,
      'get-data': this.getData,
      passData: this.passData,
      'pass-data': this.passData,
      'update-data': this.updateData,
      updateData: this.updateData,
      updateState: this.updateState,
      screenComplete: this.screenComplete,
      openMenu: this.openMenu,
      menuClose: this.menuClose,
      getState: this.getState,
      emit: this.emit,
      quit: this.quit,
      save: this.load,
      complete: this.checkComplete,
      incomplete: this.checkComplete,
      ready: this.checkReady,
      resize: this.scale,
      getGame: this.getGame,
    };

    fn = events[event];
    if (typeof fn === 'function') {
      return fn.call(this, opts);
    }
  }

  emit(gameData = {}) {
    var p, self = this;
    p = new Promise(resolve => {
      var event;

      if (typeof gameData !== 'object') return;

      if (!gameData.game) {
        gameData.game = self.config.id;
      }

      if (!gameData.version) {
        gameData.version = self.config.version;
      }

      event = new Event('game-event', {bubbles: true, cancelable: false});

      event.name = gameData.name;
      event.gameData = gameData;
      event.respond = gameData.respond || (data => {
        resolve(data);
      });

      if (window.frameElement) {
        window.frameElement.dispatchEvent(event);
      }
    });

    p.then(d => {
      self.trigger(d.name, d);
    });

    return p;
  }

  getGame(opts) {
    if (this.config.id === opts.id) {
      opts.respond(this);
    }
  }

  getData(opts) {
    opts.name = 'getData';
    return this.emit(opts);
  }

  passData(opts) {
    if (typeof opts.respond === 'function') {
      opts.respond(this.props.passData.apply(this, arguments));
    } else {
      return this.props.passData.apply(this, arguments);
    }
  }

  load(opts) {
    if (opts.game === this.config.id &&
      opts.version === this.config.version &&
      opts.highestScreenIndex) {
      if (opts.highestScreenIndex === this.screensLength - 1) return;
      this.loadScreens(opts.highestScreenIndex);
    }
  }

  quit() {
    this.emit({
      name: 'exit',
      game: this.config.id,
    });
  }

  updateState(opts) {
    if (typeof opts.path === 'string') {
      opts.data = {
        screens: {
          [this.state.currentScreenIndex]: {
            [opts.path]: opts.data
          }
        }
      };
      this.updateData(opts);
    } else if (_.isArray(opts.path)) {
      opts.data = _.setWith({}, opts.path, opts.data, Object);
      this.updateData(opts);
    }
  }

  updateData(opts) {
    var data = _.merge(this.state.data, opts.data);

    this.setState({
      data,
    }, () => {
      if (typeof opts.callback === 'function') {
        opts.callback.call(this);
      }
    });
  }

  checkComplete() {
    var openScreen = this.refs['screen-' + this.state.currentScreenIndex];

    if (openScreen && typeof openScreen.checkComplete === 'function') {
      openScreen.checkComplete();
    }
  }

  // this method takes in an opts method with screenID
  screenComplete(opts) {
    if (opts.silent) return;
    if (this.audio['screen-complete']) {
      this.audio['screen-complete'].play();
    }
  }

  getClassNames() {
    var screen, screenClass;

    screen = this.refs['screen-' + this.state.currentScreenIndex];
    screenClass = screen ? 'SCREEN-' + screen.props.id : '';

    return classNames(
      'pl-game',
      'skoash-game',
      {
        iOS: this.state.iOS,
        MOBILE: this.state.mobile,
        SFX: this.state.playingSFX.length,
        'VOICE-OVER': this.state.playingVO.length,
        PAUSED: this.state.paused,
        LOADING: this.state.loading,
        MENU: this.state.openMenus.length,
        ['MENU-' + this.state.openMenus[0]]: this.state.openMenus[0],
        DEMO: this.state.demo,
      },
      'SCREEN-' + this.state.currentScreenIndex,
      screenClass,
      ...this.state.classes,
      super.getClassNames()
    );
  }

  getStyles() {
    var transform, transformOrigin;

    transform = `scale3d(${this.state.scale},${this.state.scale},1)`;
    transformOrigin = this.state.scale < 1 ? '0px 0px 0px' : '50% 0px 0px';

    return {
      transform,
      WebkitTransform: transform,
      transformOrigin,
      WebkitTransformOrigin: transformOrigin,
    };
  }

  renderScreens() {
    var screenKeys, self = this;
    screenKeys = Object.keys(self.screens);
    self.screensLength = screenKeys.length;
    return screenKeys.map((key, index) => {
      var ScreenComponent, props;
      props = self.screens[key].props || {};
      props.data = self.state.data.screens[key];
      props.gameState = self.state;
      props.index = index;
      ScreenComponent = self.screens[key];
      return ScreenComponent(props, 'screen-' + key, key);
    });
  }

  renderMenuScreens() {
    return _.map(this.menus, (Menu, key) =>
      <Menu.type
        {...Menu.props}
        gameState={this.state}
        key={key}
        index={key}
        ref={'menu-' + key}
      />
    );
  }

  render() {
    return (
      <div className={this.getClassNames()} style={this.getStyles()}>
        {this.renderContentList('loader')}
        {this.renderContentList('assets')}
        {this.props.renderMenu.call(this)}
        {this.renderScreens()}
        {this.renderMenuScreens()}
      </div>
    );
  }
}

Game.defaultProps = _.defaults({
  getBackgroundIndex: () => 0,
  passData: _.identity,
  screens: {
    0: function (props, ref, key) {
      return (
        <Screen
          {...props}
          ref={ref}
          key={key}
        />
      );
    }
  },
  menus: {
    Screen
  },
  ignoreReady: true,
  renderMenu: function () {
    return (
      <div className="menu">
        <button className="close" onClick={this.openMenu.bind(this, {id: 'quit'})}></button>
      </div>
    );
  },
  getGotoOpts: _.identity,
}, Component.defaultProps);

export default Game;
