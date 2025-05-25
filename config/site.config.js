/**
 * Website configuration including shared folder, title, fonts, icons, contact info, etc.
 */
module.exports = {
  // [OPTIONAL] Website icon to the left of the title in the navigation bar
  // Place it in the /public directory and reference it with a relative path
  icon: '/icons/128.png',

  // Prefix for KV Storage
  kvPrefix: process.env.KV_PREFIX || '',

  // Website name
  title: "File Storage Index",

  // Root directory to be shared publicly. Use '/' to share the root folder
  baseDirectory: '/',

  // [OPTIONAL] Maximum number of items in a directory, supports pagination
  maxItems: 100,

  // [OPTIONAL] Use Google Fonts for font customization
  // Check and create necessary links at https://fonts.google.com
  googleFontSans: 'Inter',
  googleFontMono: 'Fira Mono',
  googleFontLinks: ['https://fonts.googleapis.com/css2?family=Fira+Mono&family=Inter:wght@400;500;700&display=swap'],

  // [OPTIONAL] Website footer component
  footer:
  'Powered by <a href="https://github.com/spencerwooo/onedrive-vercel-index" target="_blank" rel="noopener noreferrer">File Storage Index</a>. Made with ❤ by doandat943',

  // [OPTIONAL] Password-protected paths
  protectedRoutes: ['/Private folder/protected', '/Test files/Protected route'],

  // [OPTIONAL] Email address displayed in the navigation bar (leave empty to hide)
  email: 'mailto:doandat943@joverse.us',

  // [OPTIONAL] Array of names and links for social information
  links: [
    {
      name: 'GitHub',
      link: 'https://github.com/doandat943/file-storage-index',
    },
  ],

  // Datetime format using day.js
  datetimeFormat: 'YYYY-MM-DD HH:mm:ss',
}
