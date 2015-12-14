# Play.js
*v0.1.2*

To make this buld work. Strict mode needs to be disabled for the ES6 modules.

Simply add this line to line 41 of the `enter()` function in `node_modules/babel-core/lib/transformation/transformers/other/strict.js`
```
return false; // MR: Do not add strict mode.
```
Then you can run gulp.

## Make a game!

### Setup

Making a new game is simple. Just add jQuery (only dependacy) and the the library to your HTML file.
```html
<script type="text/javascript" src="jquery-1.11.3.min.js"></script>
<script type="text/javascript" src="build/play.js"></script>
```

Or you pull down the repo as a node module and import with Webpack.

**package.json**
```json
{ "devDependencies": {
	"js-interactive-library": "github:ginasink/js-interactive-library#v0.1.0"
} }
```
**index.js**
```javascript
// ES6 import. CommonJS or AMD will work too.
import 'js-interactive-library';
```

Now define your game

**index.html**
```html
<html>
	<head></head>
	<body id="my-game"></body>
</html>
```
Make your configuration file.
**config.game.js**
```javascript
pl.game.config({
	// The CSS class name to match for screens
	screenSelector: '.screen',
	// Where your components live
	componentDirectory: 'components/',
	// defines the game viewport
	dimensions: {
		width: 960,
		ratio: 16/9
	}
});
```
**index.js**
```javascript
import 'js-interactive-library';
// Import your configuration
import 'config.game';

// Import your components
import 'components/screen-basic/behavior';
import 'components/title/behavior';

// Register your game
pl.game('my-game', function () { 

});
```

### Create a screen

Here we use the `<section>` element so we can use `<h1>` tags for each screen and still follow proper semantics. However you may use any node type you wish as long as you have the `screenSelector` class name you defined in your configuration on the element.

```html
<body id="my-game">
	<section id="welcome" class="screen">
		<h1>Welcom!</h1>
		<!-- Attach a normalized interation event on the button. -->
		<button pl-action="speak()">Hello</button>
		<div class="message">World</div>
	</section>
</body>
```

This library relies heavily on UIState, a design patter in which you define changes in the user interface with ALL CAPS class names. Here we define what the `.message` element should look like when "`OPEN`" .

```css
/* By default our view is hidden */
#welcome .message {
	opacity: 0;
	transition: opacity 1s;
}

/* When the class is added we get our element displayed with our 1 second transition. */
#welcome .message.OPEN {
	opacity: 1;
}
```

Now we can define our behavior.

```javascript
pl.game('my-game', function () { 
	
	// Register the screen with id welcome.
	this.screen('welcome', function () {

		// define speak() which will be called when the user
		// interacts (click: desktop, touchend: mobile) with the button.
		this.speak = function () {
			// Adds the OPEN class to the .message element.
			// This will only match elements that live in
			// your screen and are not decendants of a child scope.
			//
			this.open('.message');
		};

	});

});
```

See {@link module:types/Entity~Entity} for reference on the UIState methods available.
