const path = require('path')

module.exports = {
    entry: [
		'./scripts/commander.ts',
	],
	module: {
		rules: [
		  {
			test: /\.tsx?$/,
			use: 'ts-loader',
			exclude: /node_modules/
		  },
		],
	  },	
    output: {
      	filename: 'index.js',
		path: path.resolve(__dirname, 'resources', 'web', 'scripts'),
		clean: true
    },
	resolve: {
        extensions: [ '.ts', '.js' ],
    }	
}