To make this buld work. Strict mode needs to be disabled for the ES6 modules.

Simply add this line
"return false; // MR: Do not add strict mode."
to line 41 of the enter() function in
node_modules/babel-core/lib/transformation/transformers/other/strict.js

Then you can run gulp.