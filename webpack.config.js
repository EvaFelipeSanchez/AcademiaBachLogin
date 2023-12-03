const path = require('path');

module.exports = {
  entry: './server.js',
  mode: 'development',
  target: 'node',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.html$/,
        loader: 'html-loader',
      },
      {
        test: /\.cs$/,
        loader: 'raw-loader', 
      },

    ],
  },
};