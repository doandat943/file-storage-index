const { i18n } = require('./next-i18next.config')

module.exports = {
  reactStrictMode: true,
  // Required by Next i18n with API routes, otherwise API routes 404 when fetching without trailing slash
  trailingSlash: true
}
