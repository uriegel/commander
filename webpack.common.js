const path = require('path')

module.exports = {
    entry: [
		'./scripts/index.js',
	],
    output: {
      	filename: 'index.js',
		path: path.resolve(__dirname, 'web', 'dist'),
		clean: true
    }
}