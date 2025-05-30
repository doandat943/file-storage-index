const path = require('path')

module.exports = {
  i18n: {
    defaultLocale: 'en-US',
    locales: ['de-DE', 'en-US', 'es-ES', 'zh-CN', 'hi-IN', 'id-ID', 'tr-TR', 'zh-TW'],
    localeDetection: false,
  },
  localePath: path.resolve('public/locales'),
  reloadOnPrerender: process.env.NODE_ENV === 'development',
  keySeparator: false,
  namespaceSeparator: false,
  pluralSeparator: '——',
  contextSeparator: '——'
}