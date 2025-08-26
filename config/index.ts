import { defineConfig, type UserConfigExport } from '@tarojs/cli'
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin'
import devConfig from './dev'
import prodConfig from './prod'
import TerserPlugin from 'terser-webpack-plugin'

export default defineConfig<'webpack5'>(async (merge, { command, mode }) => {
  const baseConfig: UserConfigExport<'webpack5'> = {
    projectName: 'ocrApp',
    date: '2025-8-6',
    designWidth: 375,
    deviceRatio: { 640: 2.34 / 2, 750: 1, 375: 2, 828: 1.81 / 2 },
    sourceRoot: 'src',
    outputRoot: 'dist',
    plugins: ['@tarojs/plugin-html'],
    defineConstants: {},
    copy: { patterns: [], options: {} },
    framework: 'react',
    compiler: { type: 'webpack5', prebundle: { enable: false } },
    cache: { enable: false },
    mini: {
      postcss: {
        pxtransform: { enable: true, config: { selectorBlackList: ['nut-'] } },
        cssModules: {
          enable: true,
          config: { namingPattern: 'module', generateScopedName: '[name]__[local]___[hash:base64:5]' }
        }
      },
      webpackChain(chain) {
        chain.resolve.plugin('tsconfig-paths').use(TsconfigPathsPlugin)

        if (process.env.NODE_ENV === 'production') {
          // 开启 JS 压缩
          chain.optimization.minimize(true)
          // 使用 Terser 并去掉 console，使用类型断言避免报错
          chain.optimization.minimizer('terser').use(TerserPlugin as any, [{
            terserOptions: {
              compress: { drop_console: true },
              mangle: true
            }
          }])
        }
      }
    },
    h5: {
      publicPath: '/',
      staticDirectory: 'static',
      output: { filename: 'js/[name].[hash:8].js', chunkFilename: 'js/[name].[chunkhash:8].js' },
      miniCssExtractPluginOption: { ignoreOrder: true, filename: 'css/[name].[hash].css', chunkFilename: 'css/[name].[chunkhash].css' },
      postcss: { autoprefixer: { enable: true, config: {} }, cssModules: { enable: false } },
      webpackChain(chain) { chain.resolve.plugin('tsconfig-paths').use(TsconfigPathsPlugin) }
    },
    rn: { appName: 'taroDemo', postcss: { cssModules: { enable: false } } }
  }

  if (process.env.NODE_ENV === 'development') {
    return merge({}, baseConfig, devConfig)
  }
  return merge({}, baseConfig, prodConfig)
})
