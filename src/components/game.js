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
        if (!this.state.iOS) {
            this.setState({
                currentScreenIndex: 1,
            });
        }

        this.screensLength = Object.keys(this.screens).length;

        this.collectMedia();
        this.loadScreens(this.state.currentScreenIndex, false);

        this.DOMNode = ReactDOM.findDOMNode(this);

        this.props.onBootstrap.call(this);
    }

    loadScreens(currentScreenIndex, goto = true) {
        var firstScreen;
        var secondScreen;

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

  // paused should be a boolean determining whether to call
  // audio.pause or audio.resume
    setPause(paused) {
        var fnKey = paused ? 'pause' : 'resume';

        this.setState({
            paused
        }, () => {
            _.each(this.state.playingBKG, audio => _.invoke(audio, fnKey));
            _.invoke(this.refs['screen-' + this.state.currentScreenIndex], fnKey);
        });
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

  // remove once games are refactored to call this.eventManager.emit(gameData);
  // all-about-you
    emit(gameData = {}) {
        return this.eventManager.emit(gameData);
    }

    getGame(opts) {
        if (this.config.id === opts.id) _.invoke(opts, 'respond', this);
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

  // this method takes in an opts parameter object with screenID
    screenComplete(opts) {
        this.props.screenComplete.call(this, opts);
    }

    getClassNames() {
        var screen;
        var screenClass;

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
        var transform;
        var transformOrigin;

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
    screenComplete: function (opts) {
        if (opts.silent) return;
        this.playMedia('screen-complete');
    },
}, Component.defaultProps);

export default Game;
