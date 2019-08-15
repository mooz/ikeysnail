const path = require('path');
const webpack = require('webpack');

/*
 * SplitChunksPlugin is enabled by default and replaced
 * deprecated CommonsChunkPlugin. It automatically identifies modules which
 * should be splitted of chunk by heuristics using module duplication count and
 * module category (i. e. node_modules). And splits the chunks…
 *
 * It is safe to remove "splitChunks" from the generated configuration
 * and was added as an educational example.
 *
 * https://webpack.js.org/plugins/split-chunks-plugin/
 *
 */

module.exports = {
	  mode: 'development',
    target: 'node',
	  entry: {
		  "main": './src/main.js',
		  "content-script": './src/content-script.js'
	  },
	  output: {
		    filename: '[name].js',
		    path: path.resolve(__dirname, 'package')
	  },

	  plugins: [new webpack.ProgressPlugin()],

    resolve: {
        modules: ["./src", "./node_modules"],
    },

	  module: {
		    rules: [
			      {
				        test: /.(js|jsx)$/,
				        include: [],
				        loader: 'babel-loader',

				        options: {
					          plugins: ['syntax-dynamic-import'],

					          presets: [
						            [
							              '@babel/preset-env',
							              {
								                modules: false
							              }
						            ]
					          ]
				        }
			      }
		    ]
	  },

	  optimization: {
		    splitChunks: {
			      cacheGroups: {
				        vendors: {
					          priority: -10,
					          test: /[\\/]node_modules[\\/]/
				        }
			      },

			      chunks: 'async',
			      minChunks: 1,
			      minSize: 30000,
			      name: true
		    }
	  },

	  devServer: {
		    open: true
	  }
};
