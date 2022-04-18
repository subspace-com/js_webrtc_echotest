const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');

const extensions = ['.ts', '.tsx', '.js', '.jsx'];

module.exports = {
  resolve: {
    extensions,
  },
  entry: path.join(__dirname, 'example', 'index.tsx'),
  output: {
    path: path.resolve(__dirname, 'dist/example'),
  },
  module: {
    rules: [
      {
        test: /\.svg$/,
        use: ['@svgr/webpack'],
      },
      {
        test: /\.(png|jp(e*)g|svg|gif)$/,
        use: ['file-loader'],
      },
      {
        test: /\.css$/i,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  [
                    'postcss-preset-env',
                    {
                      // Options
                    },
                  ],
                ],
              },
            },
          },
        ],
      },
      {
        test: /\.tsx?$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'swc-loader',
        },
      },
    ],
  },
  plugins: [new HtmlWebpackPlugin(), new ESLintPlugin({ extensions, emitWarning: false })],
  devServer: {
    port: 3000,
  },
  mode: 'development',
  optimization: {
    minimize: false,
  },
};
