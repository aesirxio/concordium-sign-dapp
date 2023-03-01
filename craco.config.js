const { loaderByName, removeLoaders } = require('@craco/craco');
module.exports = {
  eslint: {
    enable: false,
  },
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      removeLoaders(webpackConfig, loaderByName('source-map-loader'));
      return webpackConfig;
    },
  },
};
