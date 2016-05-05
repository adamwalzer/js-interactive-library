/**
*  Screen
*  @desc Contains...
*  @proto Entity
*/

import { Entity, invokeResponsibilities } from 'types/Entity';

var Screen = Entity.extend(function () {

  function attachBehaviorEvent () {
    this.on('behavior', function (_event) {
      // console.log('SCREEN GOT', _event.targetScope.id(), _event.name);

      if (this !== _event.targetScope) {
        invokeResponsibilities(this,  _event);
      }
      
      this.propagateBehavior(_event);
    });
  }
  
  this.baseType = 'TYPE_SCREEN';
  this.game = null;
  this.screen = null;

  this.__init = function () {
    this.proto();

    if (this.is(pl.game.config('screenSelector'))) {
      attachBehaviorEvent.call(this);
    }
  };

  this.start = function () {
    this.startAudio();
    return this;
  };

  this.stop = function () {
    this.stopAudio();
    return this;
  };

  this.pause = function() {
    this.pauseMedia();
    if(this.hasOwnProperty('entities') && this.entities) {
      this.entities.forEach(function(entity) {
        if(typeof entity.pause === 'function') entity.pause();
      });
    }
    return this;
  };

  this.resume = function() {
    this.resumeMedia();
    if(this.hasOwnProperty('entities') && this.entities) {
      this.entities.forEach(function(entity) {
        if(typeof entity.resume === 'function') entity.resume();
      });
    }
    return this;
  };

  this.startAudio = function () {
    if (!this.audio) return;
    this.audio.background.play();
    this.audio.voiceOver.play();
  };

  this.stopAudio = function () {
    if (!this.audio) return;
    this.audio.voiceOver.stop('@ALL');
  };

  this.pauseMedia = function() {
    if(!this.currentMedia) return;
    for(var media in this.currentMedia) { 
      if(this.currentMedia.hasOwnProperty(media)) {
        if(this.currentMedia[media]) this.currentMedia[media].pause();
      }
    }
  };

  this.resumeMedia = function() {
    if(!this.currentMedia) return;
    for(var media in this.currentMedia) { 
      if(this.currentMedia.hasOwnProperty(media)) {
        if(this.currentMedia[media]) this.currentMedia[media].resume();
      }
    }
  };

  this.index = function () {
    if (this === this.screen) return this.game.screens.indexOf(this);
    return this.$els.index();
  };

  this.next = function () {
    var nextScreen = this.game.screens[this.screen.index() + 1];
    var loadingScreen = this.game.screens[this.screen.index() + 2];

    if (!nextScreen.$els.hasClass('preloading') && !nextScreen.$els.hasClass('preloaded')) {
      nextScreen.$els.addClass('preloading');
      $('#' + nextScreen.$els.context.id).load(`screens/${nextScreen.$els.context.id}.html`, function () {
        nextScreen.$els.addClass('preloaded');
        nextScreen.$els.removeClass('preloading');
        //pl.game.component.loadAll(function () {
        //  pl.game.initialize([{id: 'animal-id', implementation: _.noop}]);
        //}, true);
        //pl.game.initializeScreen(nextScreen.$els, 'screen-basic');
        window.magic[nextScreen.id()] && window.magic[nextScreen.id()]();
      });
    }

    if (!this.completed() || !nextScreen.$els.hasClass('preloaded')) return false;

    if(loadingScreen && !loadingScreen.$els.hasClass('preloading') && !loadingScreen.$els.hasClass('preloaded')) {
      $('#' + loadingScreen.$els.context.id).load(`screens/${loadingScreen.$els.context.id}.html`, function () {
        loadingScreen.$els.addClass('preloaded');
        //pl.game.component.loadAll(function () {
        //  pl.game.initialize([{id: 'animal-id', implementation: _.noop}]);
        //}, true);
        //pl.game.initializeScreen(loadingScreen.$els, 'screen-basic');
        window.magic[loadingScreen.id()] && window.magic[loadingScreen.id()]();
      });
    }

    return nextScreen;
  };

  this.prev = function () {
    return this.game.screens[this.screen.index()-1];
  };

  this.quit = function () {
    this.game.quit.open();
  };

  this.nextSib = function () {
    return $.fn.next.apply(this.$els, arguments);
  };

  this.prevSib = function () {
    return $.fn.prev.apply(this.$els, arguments);
  };

  this.isLast = function () {
    return this.game.screens.indexOf(this.screen) === this.game.screens.length-1;
  };

});

export default Screen;
