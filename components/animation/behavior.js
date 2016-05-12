pl.game.component('animation', function () {

  function nextFrame (_time, _frameRate, _targetFrameRate) {
    this.render(this.frame);

    this.frame+=1;

    if (this.frame >= this.totalFrames) this.frame = 0;
  }
  
  this.canvas = null;
  this.ctx = null;
  this.buffer = null;
  this.frameSize = null;
  this.grid = null;
  this.frame = 0;
  this.frameRate = 30;
  this.totalFrames = 0;

  this.handleProperty(function () {
    
    this.frame = function (_node, _name, _value) {
      var $node, size, grid, tokenizer;

      $node = $(_node);
      tokenizer = /\s*[,x]\s*/;

      if ($node.is('img')) {
        size = _value.split(tokenizer).map(Number);
        grid = $node.attr('pl-grid');
        this.frameSize = pl.Size.create().set(size);

        if (grid) {
          grid = grid.split(tokenizer).map(Number);
          this.grid = pl.Point.create().set(grid);  
          this.totalFrames = this.grid.product();
        }
      }

      else {
        console.error('Error: Invalid frame property on', $node.address(), 'in', this.id());
      }
    };

  });

  this.init = function () {
    this.buffer = {
      node: document.createElement('canvas'),
      ctx: null
    };

    this.ctx = this.canvas[0].getContext('2d');
    this.buffer.ctx = this.buffer.node.getContext('2d');

    this.frameSize.applyTo(this.canvas[0]);
  };

  this.play = function () {
    this.eachFrame(nextFrame);
  };

  this.ready = function () {
    this.play();
    this.screen.open();
  };

  this.start = function () {
    this.render(1);
  };

  this.render = function (_frame) {
    var c, crop, row, column, frame;

    c = this.ctx;
    frame = _frame != null ? _frame : 0;
    column = frame % this.grid.x;
    row = Math.floor(frame / this.grid.x);

    crop = {
      x: this.frameSize.width * column,
      y: this.frameSize.height * row,
      width: this.frameSize.width,
      height: this.frameSize.height
    };

    c.clearRect(0,0, this.frameSize.width, this.frameSize.height);
    c.drawImage(this.source[0], crop.x, crop.y, crop.width, crop.height, 0,0, this.frameSize.width, this.frameSize.height);
  };

});