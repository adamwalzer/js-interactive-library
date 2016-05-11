pl.game.component('dropzone', function () {
    
  this.entity('.area', function () {
    
    this.cache = null;

    this.respond('grab', function () {
      this.cache = {
        position: this.absolutePosition(),
        size: this.size()
      };
    });

    this.respond('release', function (_event) {
      if (_event.state.progress.point && this.isPointInBounds(_event.state.progress.point)) {
        if (this.takes(_event.state.$draggable.id())) {
          _event.state.$draggable.removeClass('PLUCKED');
          _event.state.$helper.addClass('DROPED');
          
          this.drop(_event.state.$draggable);
          
          return;
        }
      }

      _event.state.$helper.addClass('RETURN');
    });

  });

  this.init = function () {
    this.takes().forEach(this.bind(function (_id) {
      this.require(_id);
    }));
  };

  this.takes = function (_id) {
    var takes = this.properties.take.split(/\s+/);
    return arguments.length ? !!~takes.indexOf(_id) : takes;
  };

  this.isPointInBounds = function (_point, _y) {
    var point, position;

    point = pl.Point.create(arguments);

    if (point.x >= this.cache.position.x && point.x <= this.cache.position.x+this.cache.size.width) {
      if (point.y >= this.cache.position.y && point.y <= this.cache.position.y+this.cache.size.height) {
        return true;
      }
    }

    return false;
  };

  this.isBoxInBounds = function (_point, _size) {
    // comming soon!
  };

  this.behavior('drop', function (_$thing) {    
    console.log('*** In bounds!!', _$thing.id());
    
    this.requiredQueue.ready(_$thing.id());

    return {
      behaviorTarget: _$thing
    };
  });

});