const path = require('path')

module.exports = {
    entry: [
		'./scripts/commander.ts',
	],
	module: {
		rules: [
		  {
			test: /\.tsx?$/,
			use: 'ts-loader'
		  },
		],
	  },	
    output: {
      	filename: 'index.js',
		path: path.resolve(__dirname, 'web', 'dist'),
		clean: true
    }
}