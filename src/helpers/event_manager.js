class EventManager {
    constructor(game) {
        this.attachEvents = this.attachEvents.bind(game);
        this.onKeyDown = this.onKeyDown.bind(game);
        this.emit = this.emit.bind(game);
        this.emitSave = this.emitSave.bind(game);
        this.trigger = this.trigger.bind(game);

        this.attachEvents();
    }

    attachEvents() {
        var onblur;
        var onfocusout;

        window.addEventListener('resize', () => {
            this.scale();
        });
        window.addEventListener('orientationchange', () => {
            window.dispatchEvent(new Event('resize'));
        });
        if (window.parent) {
            window.parent.addEventListener('orientationchange', () => {
                window.dispatchEvent(new Event('orientationchange'));
            });
        }

        window.addEventListener('keydown', e => {
            this.eventManager.onKeyDown(e);
        });

        window.addEventListener('platform-event', e => {
            this.eventManager.trigger(e.name, e.gameData);
        });

        window.addEventListener('trigger', e => {
            this.eventManager.trigger(e.name, e.opts);
        });

        window.addEventListener('load', window.focus);
        window.addEventListener('focus', () => {
            this.resume();
        });

        onblur = () => {
            var node = document.activeElement.parentNode;
            while (node != null) {
                if (node === this.DOMNode) {
                    return;
                }
                node = node.parentNode;
            }
            this.pause();
        };

        onfocusout = () => {
            this.pause();
        };

        window.addEventListener('blur', onblur);

        /* eslint-disable max-len */
        // code from http://stackoverflow.com/questions/1060008/is-there-a-way-to-detect-if-a-browser-window-is-not-currently-active
        /* eslint-enable */
        // Standards:
        if ('hidden' in document) {
            document.addEventListener('visibilitychange', onfocusout);
        } else if ('mozHidden' in document) {
            document.addEventListener('mozvisibilitychange', onfocusout);
        } else if ('webkitHidden' in document) {
            document.addEventListener('webkitvisibilitychange', onfocusout);
        } else if ('msHidden' in document) {
            document.addEventListener('msvisibilitychange', onfocusout);
        } else if ('onfocusin' in document) {
            // IE 9 and lower:
            document.onfocusin = document.onfocusout = onfocusout;
        } else {
            // All others:
            window.onpageshow = window.onpagehide = window.onfocus = window.onblur = onfocusout;
        }
    }

    onKeyDown(e) {
        if (e.keyCode === 78) { // n for next
            this.navigator.goto({index: this.state.currentScreenIndex + 1});
        } else if (e.keyCode === 66) { // b for back
            this.navigator.goto({index: this.state.currentScreenIndex - 1});
        } else if (e.altKey && e.ctrlKey && e.keyCode === 68) { // alt + ctrl + d
            this.demo();
        }
    }

    emit(gameData = {}) {
        var p;
        var self = this;
        p = new Promise(resolve => {
            var event;

            if (typeof gameData !== 'object') return;
            if (!gameData.game) gameData.game = self.props.config.id;
            if (!gameData.version) gameData.version = self.props.config.version;

            event = new Event('game-event', {bubbles: true, cancelable: false});

            event.name = gameData.name;
            event.gameData = gameData;
            event.respond = gameData.respond || (data => {
                resolve(data);
            });

            if (window.frameElement) window.frameElement.dispatchEvent(event);
        });

        p.then(d => {
            self.eventManager.trigger(d.name, d);
        });

        return p;
    }

    emitSave(highestScreenIndex, currentScreenIndex) {
        if (highestScreenIndex < 2) return;
        this.eventManager.emit({
            name: 'save',
            game: this.props.config.id,
            version: this.props.config.version,
            highestScreenIndex,
            currentScreenIndex,
        });
    }

    trigger(event, opts) {
        _.invoke(this.props.getTriggerEvents.call(this, {
            goto: this.navigator.goto,
            goBack: this.navigator.goBack,
            audioPlay: this.mediaManager.audioPlay,
            audioStop: this.mediaManager.audioStop,
            videoPlay: this.mediaManager.videoPlay,
            videoStop: this.mediaManager.videoStop,
            demo: this.demo,
            toggleDemoMode: this.demo,
            getData: this.getData,
            passData: this.passData,
            updateState: this.updateState,
            updateGameData: this.updateGameData,
            updateScreenData: this.updateScreenData,
            updateData: this.updateData,
            screenComplete: this.screenComplete,
            openMenu: this.navigator.openMenu,
            menuClose: this.navigator.menuClose,
            getState: this.getState,
            emit: this.eventManager.emit,
            quit: this.quit,
            save: this.load,
            complete: this.checkComplete,
            incomplete: this.checkComplete,
            ready: this.checkReady,
            resize: this.scale,
            getGame: this.getGame,
        })[_.camelCase(event)], 'call', this, opts);
    }
}

export default EventManager;
