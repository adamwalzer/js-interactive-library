import _ from 'lodash';
import classNames from 'classnames';

// import util from 'methods/util';

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

    this.attachEvents();
  }

  attachEvents() {
    var self = this;

    window.addEventListener('load', window.focus);
    window.addEventListener('focus', () => {
      self.resume();
    });
    window.addEventListener('blur', () => {
      self.pause();
    });

    window.addEventListener('resize', () => {
      self.scale();
    });
    window.addEventListener('orientationchange', () => {
      window.dispatchEvent(new Event('resize'));
    });
    if (window.parent) {
      window.parent.addEventListener('orientationchange', () => {
        window.dispatchEvent(new Event('orientationchange'));
      });
    }

    window.addEventListener('keydown', function (e) {
      self.onKeyUp(e);
    });

    window.addEventListener('platform-event', function (e) {
      self.trigger(e.name, e.gameData);
    });

    window.addEventListener('trigger', function (e) {
      self.trigger(e.name, e.opts);
    });
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

  onKeyUp(e) {
    if (e.keyCode === 39) { // right
      this.goto({index: this.state.currentScreenIndex + 1});
    } else if (e.keyCode === 37) { // left
      this.goto({index: this.state.currentScreenIndex - 1});
    } else if (e.altKey && e.ctrlKey && e.keyCode === 68) { // alt + ctrl + d
      this.demo();
    }
  }

  componentWillMount() {
    this.emit({
      name: 'init',
    });
    this.detechDevice();
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
    self.loadScreens(this.state.currentScreenIndex, false);
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
      this.state.playingBKG.forEach(audio => {
        audio[fnKey]();
      });

      openScreen = this.refs['screen-' + this.state.currentScreenIndex];
      if (openScreen && typeof openScreen[fnKey] === 'function') {
        openScreen[fnKey]();
      }
    });
  }

  /**
   * Detects the device and adds the appropriate state classes.
   */
  detechDevice() {
    this.setState({
      iOS: this.iOS(),
      mobile: this.mobileOrTablet(),
    });
  }
  /**
   * this code came from http://stackoverflow.com/questions/9038625/detect-if-device-is-ios
   */
  iOS() {
    var iDevices = [
      'iPad Simulator',
      'iPhone Simulator',
      'iPod Simulator',
      'iPad',
      'iPhone',
      'iPod'
    ];

    if (navigator.platform) {
      while (iDevices.length) {
        if (navigator.platform === iDevices.pop()) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * this code came from http://stackoverflow.com/questions/11381673/detecting-a-mobile-browser
   */
  mobileOrTablet() {
    var check = false;
    /* eslint-disable */
    (function (a){ if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4)))check = true; })(navigator.userAgent || navigator.vendor || window.opera);
    /* eslint-enable */
    return check;
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
      highestScreenIndex, screenIndexArray, data, back = false, buttonSound;

    data = this.state.data;
    oldIndex = this.state.currentScreenIndex;
    oldScreen = this.refs['screen-' + oldIndex];
    if (!opts.load && oldScreen && oldScreen.state && oldScreen.state.opening) {
      return;
    }

    if (typeof opts.index === 'number') {
      if (opts.index > this.screensLength - 1) {
        return this.quit();
      }
      currentScreenIndex = Math.min(this.screensLength - 1, Math.max(0, opts.index));
      nextScreen = this.refs['screen-' + (currentScreenIndex + 1)];
      highestScreenIndex = Math.max(this.state.highestScreenIndex, currentScreenIndex);
    } else if (typeof opts.index === 'string') {
      currentScreenIndex = opts.index;
      highestScreenIndex = this.state.highestScreenIndex;
    }
    newScreen = this.refs['screen-' + currentScreenIndex];
    prevScreen = this.refs['screen-' + (currentScreenIndex - 1)];
    screenIndexArray = this.state.screenIndexArray;

    if (oldScreen.props.index < newScreen.props.index) {
      if (!opts.load && !this.state.demo && !(oldScreen.state.complete || oldScreen.state.replay)) {
        return;
      }
    }

    if (oldScreen.props.index > newScreen.props.index) {
      if (newScreen.props.index === 0) {
        return;
      }
    }

    if (newScreen) {
      // this should never be dropped into
      if (!newScreen.state.load || !newScreen.state.ready) {
        this.loadScreens(currentScreenIndex, false);
      }
      screenIndexArray.push(currentScreenIndex);
      newScreen.open(opts);
    }

    if (prevScreen) prevScreen.replay();

    if (oldScreen && oldScreen !== newScreen) {
      if (oldScreen.props.index > newScreen.props.index) {
        back = true;
        oldScreen.close();
      } else {
        oldScreen.leave();
      }

      if (oldScreen.props.resetOnClose) {
        data = _.cloneDeep(this.state.data);
        data.screens[oldIndex] = {};
      }
    }

    if (nextScreen) {
      nextScreen.load();
    }

    this.setState({
      loading: false,
      currentScreenIndex,
      highestScreenIndex,
      screenIndexArray,
      classes: [],
      data,
    });

    if (!opts.load) {
      this.emitSave(highestScreenIndex, currentScreenIndex);
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

    this.playBackground(currentScreenIndex);
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

  getBackgroundIndex(index) {
    return this.props.getBackgroundIndex.call(this, index);
  }

  playBackground(currentScreenIndex) {
    var index, playingBKG, currentScreen;

    if (!_.isFinite(currentScreenIndex)) return;

    index = this.getBackgroundIndex(currentScreenIndex);
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
      audioPlay: this.audioPlay,
      audioStop: this.audioStop,
      videoPlay: this.videoPlay,
      videoStop: this.videoStop,
      demo: this.demo,
      'toggle-demo-mode': this.demo,
      getData: this.getData,
      'get-data': this.getData,
      passData: this.passData,
      'pass-data': this.passData,
      'update-data': this.updateData,
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
    };

    fn = events[event];
    if (typeof fn === 'function') {
      return fn.call(this, opts);
    }
  }

  emit(gameData = {}) {
    var p, self = this;
    p = new Promise((resolve) => {
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
      this.fadeBackground();
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
        this.raiseBackground();
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

    if (playingVideo) {
      playingVideo.stop();
    }

    playingVideo = opts.video;

    this.fadeBackground(0);

    this.setState({
      playingVideo,
    });
  }

  videoStop() {
    this.raiseBackground(1);

    this.setState({
      playingVideo: null,
    });
  }

  fadeBackground(value) {
    if (typeof value !== 'number') value = .25;
    this.state.playingBKG.forEach(bkg => {
      bkg.setVolume(value);
    });
  }

  raiseBackground(value) {
    if (typeof value !== 'number') value = 1;
    if (this.state.playingVO.length === 0) {
      this.state.playingBKG.forEach(bkg => {
        bkg.setVolume(value);
      });
    }
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
        ['SCREEN-' + this.state.currentScreenIndex]: true,
      },
      ...this.state.classes,
      super.getClassNames()
    );
  }

  getStyles() {
    var transform, transformOrigin;

    transform = `scale3d(${this.state.scale},${this.state.scale},1)`;
    transformOrigin = '50% 0px 0px';

    if (this.state.scale < 1) {
      transformOrigin = '0px 0px 0px';
    }

    return {
      transform,
      WebkitTransform: transform,
      transformOrigin,
      WebkitTransformOrigin: transformOrigin,
    };
  }

  renderLoader() {
    return this.renderContentList('loader');
  }

  renderAssets() {
    return this.renderContentList('assets');
  }

  renderMenu() {
    return (
      <div className="menu">
        <button className="close" onClick={this.openMenu.bind(this, {id: 'quit'})}></button>
      </div>
    );
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
        {this.renderLoader()}
        {this.renderAssets()}
        {this.renderMenu()}
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
  ignoreReady: true
}, Component.defaultProps);

export default Game;
