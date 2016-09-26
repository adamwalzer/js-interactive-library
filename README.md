# Skoash.js
*v1.0.2*

To build skoash either run `gulp` to build and watch or `gulp watch` to just watch or `gulp build` to build. You can also add the `--production` flag to build using the production webpack configuration.

## Make a game!

### Setup

Making a new game is simple. Just add the dependencies along with the library to your HTML file.
```html
<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.16.2/lodash.min.js"></script>
<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/react/15.0.2/react.min.js"></script>
<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/react/15.0.2/react-dom.min.js"></script>
<script type="text/javascript" src="build/skoash.1.0.2.js"></script>
```

You can also pull down the repo as a node module and import with Webpack.

**package.json**
```json
{
  "devDependencies": {
    "skoash": "github:ginasink/js-interactive-library"
  }
}
```
**index.js**
```javascript
// ES6 import. CommonJS or AMD will work too.
import 'skoash';
```

Now define your game

**index.html**
```html
<html>
  <head></head>
  <body>
    <div id="my-game"></div>
  </body>
</html>
```
Make your configuration file.
**config.game.js**
```javascript
var config = {
  id: 'my-game',
  version: 1,
  dimensions: {
    width: 960,
    ratio: 16 / 9
  },
};

export default config;
```
**index.js**
```javascript
// Import your configuration
import config from './config.game';

// Import your screens
import TitleScreen from './components/title_screen';
import LastScreen from './components/last_screen';

// Create your game
var MyGame = (
  <skoash.Game
    config={config}
  />
);

// Start your game
skoash.start(MyGame);
```

### More Instructions To Come

## Change Log
<font color="green">*v1.0.2*</font>
 - skoash.trigger now uses events to trigger the actions and promises to respond. This means any action requiring data from the trigger must be coded inside a then.
