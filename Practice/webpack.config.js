const path = require('path')

module.exports = {
  entry: './public/scripts/submitHash.js',
  module: {
    rules: [
      { test: /\.(js)$/, use: 'babel-loader' }
    ]
  },
  output: {
    path: path.resolve(__dirname, './public/scripts'),
    filename: 'bundle.js'
  },
  mode: 'development'
}