import classNames from 'classnames';

import attachEvents from 'helpers/attach_events';
import deviceDetector from 'helpers/device_detector';
import MediaManager from 'helpers/media_manager';
import Navigator from 'helpers/navigator';

import Component from 'components/component';
import Screen from 'components/screen';

class Game extends Component {
  constructor(props = {}) {
    super(props);

    this.config = props.config ? props.config : props;
    this.screens = props.screens;
    this.menus = props.menus;

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
    this.mediaManager = new MediaManager(this);
    this.navigator = new Navigator(this);
  }

  getState(opts = {}) {
    if (typeof opts.respond === 'function') opts.respond(this.state);
  }

  demo() {
    this.setState({
      demo: !this.state.demo,
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

    self.screensLength = Object.keys(self.screens).length;

    self.requireForReady = Object.keys(self.refs);
    self.requireForComplete = self.requireForReady.filter(key =>
      !self.refs[key].state || !self.refs[key].state.complete
    );

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
    if (this.state.ready) return;
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

  resume() {
    if (this.state.playingVO.length) this.mediaManager.fadeBackground();
    this.setPause(false);
  }

  pause() {
    this.setPause(true);
  }

  // paused should be a boolean determining if whether to call
  // audio.pause or audio.resume
  setPause(paused) {
    var fnKey = paused ? 'pause' : 'resume';

    this.setState({
      paused
    }, () => {
      _.forEach(this.state.playingBKG, audio => {
        audio[fnKey]();
      });

      _.invoke(this.refs['screen-' + this.state.currentScreenIndex], fnKey);
    });
  }

  goto(opts) {
    this.navigator.goto(opts);
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

  // Remove this method after refactoring games that override it.
  // all-about-you, polar-bear, tag-it
  getBackgroundIndex(index, id) {
    return this.props.getBackgroundIndex.call(this, index, id);
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
      goBack: this.navigator.goBack,
      audioPlay: this.mediaManager.audioPlay,
      audioStop: this.mediaManager.audioStop,
      videoPlay: this.mediaManager.videoPlay,
      videoStop: this.mediaManager.videoStop,
      demo: this.demo,
      'toggle-demo-mode': this.demo,
      getData: this.getData,
      passData: this.passData,
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
    if (typeof fn === 'function') return fn.call(this, opts);
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
      if (typeof opts.callback === 'function') opts.callback.call(this);
    });
  }

  checkComplete() {
    _.invoke(this.refs['screen-' + this.state.currentScreenIndex], 'checkComplete');
  }

  // this method takes in an opts method with screenID
  screenComplete(opts) {
    if (opts.silent) return;
    this.playMedia('screen-complete');
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
    return _.map(Object.keys(this.screens), (key, index) => {
      var props = this.screens[key].props || {};
      props.data = this.state.data.screens[key];
      props.gameState = this.state;
      props.index = index;
      return this.screens[key](props, 'screen-' + key, key);
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
  passData: _.noop,
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
        <button className="close" onClick={this.openMenu.bind(this, {id: 'quit'})} />
      </div>
    );
  },
  getGotoOpts: _.identity, // don't change to _.noop
  triggerReady: false,
}, Component.defaultProps);

export default Game;
