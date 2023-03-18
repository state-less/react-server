module.exports = {
  presets: [
    '@babel/preset-env',
    '@babel/preset-typescript',
    '@babel/preset-react',
  ],
  plugins: [
    [
      '@babel/plugin-transform-react-jsx',
      {
        throwIfNamespace: false, // defaults to true
        runtime: 'automatic', // defaults to classic
        importSource: '../jsxRenderer', // defaults to react
      },
    ],
    [
      '@babel/plugin-transform-runtime',
      {
        regenerator: true,
      },
    ],
  ],
  ignore: ['**/node_modules/**'],
};
