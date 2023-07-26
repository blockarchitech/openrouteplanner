var path = require("path");
var webpack = require("webpack");
const autoprefixer = require("autoprefixer");
var HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: ["./src/js/app.js", "./src/scss/styles.scss"],
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist")
  },
  //   devtool: false,

  module: {
    rules: [
      {
        test: /\.(scss)$/,
        use: [
          {
            // Adds CSS to the DOM by injecting a `<style>` tag
            loader: "style-loader"
          },
          {
            // Interprets `@import` and `url()` like `import/require()` and will resolve them
            loader: "css-loader"
          },
          {
            // Loader for webpack to process CSS with PostCSS
            loader: "postcss-loader",
            options: {
              postcssOptions: {
                plugins: () => [autoprefixer]
              }
            }
          },
          {
            // Loads a SASS/SCSS file and compiles it to CSS
            loader: "sass-loader"
          }
        ]
      },
      {
        test: /\.(png|jpe?g|gif)$/i,
        use: [
          {
            loader: "file-loader"
          }
        ]
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "!!ejs-compiled-loader!./src/views/index.ejs",
      filename: "index.html"
    }),
    new webpack.ProvidePlugin({
      $: "jquery",
      jQuery: "jquery",
      "window.jQuery": "jquery",
      Popper: ["popper.js", "default"],
      bootstrap: "bootstrap"
    })
  ]
};
