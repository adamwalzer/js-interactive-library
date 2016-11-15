import classNames from 'classnames';

import EventManager from 'helpers/event_manager';
import DeviceDetector from 'helpers/device_detector';
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

    this.eventManager = new EventManager(this);
    this.deviceDetector = new DeviceDetector(this);
    this.mediaManager = new MediaManager(this);
    this.navigator = new Navigator(this);
  }

  getState(opts = {}) {
    _.invoke(opts, 'respond', this.state);
  }

  demo() {
    this.setState({
      demo: !this.state.demo,
    });
  }

  componentWillMount() {
    this.eventManager.emit({
      name: 'init',
    });
    this.deviceDetector.detechDevice();
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
          this.navigator.goto({
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
    if (this.state.ready || this.isReady) return;
    this.isReady = true;
    this.setState({
      ready: true,
    }, () => {
      this.eventManager.emit({
        name: 'ready',
        game: this.config.id,
      });
      this.navigator.goto({
        index: this.state.currentScreenIndex,
        silent: true,
      });
      this.onReady.call(this);
      this.props.onReady.call(this);
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

  // remove once games are refactored to call this.navigator.goto(opts);
  goto(opts) {
    this.navigator.goto(opts);
  }

  // remove once games are refactored to call this.navigator.openMenu(opts);
  openMenu(opts) {
    this.navigator.openMenu(opts);
  }

  // remove once games are refactored to call this.navigator.menuClose(opts);
  menuClose(opts) {
    this.navigator.menuClose(opts);
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

  // remove once games are refactored to call this.navigator.menuClose(opts);
  trigger(event, opts) {
    this.eventManager.trigger(event, opts);
  }

  // remove once games are refactored to call this.eventManager.emit(gameData);
  emit(gameData = {}) {
    return this.eventManager.emit(gameData);
  }

  getGame(opts) {
    if (this.config.id === opts.id) {
      _.invoke(opts, 'respond', this);
    }
  }

  getData(opts) {
    this.props.getData.call(this, opts);
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
    this.eventManager.emit({
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
      _.invoke(opts.callback, 'call', this);
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
        <button className="close" onClick={this.navigator.openMenu.bind(this, {id: 'quit'})} />
      </div>
    );
  },
  getGotoOpts: _.identity, // don't change to _.noop
  getTriggerEvents: _.identity, // don't change to _.noop
  triggerReady: false,
  getData: function (opts) {
    opts.name = 'getData';
    return this.eventManager.emit(opts);
  },
}, Component.defaultProps);

export default Game;
