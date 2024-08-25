const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: {
      resolve: {
        fallback: {
          "stream": require.resolve("stream-browserify"),
          "crypto": require.resolve("crypto-browserify"),
          "assert": require.resolve("assert/"),
          "http": require.resolve("stream-http"),  // 添加 http polyfill
          "https": require.resolve("https-browserify"),
          "os": require.resolve("os-browserify/browser"),
          "url": require.resolve("url/"),
        },
      },
      plugins: [
        new webpack.ProvidePlugin({
          process: 'process/browser',
          Buffer: ['buffer', 'Buffer'],
        }),
      ],
    },
  },
};
