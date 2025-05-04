/**
 * This file contains the configuration used for customising the website, such as the folder to share,
 * the title, used Google fonts, site icons, contact info, etc.
 */
module.exports = {
  // This is what we use to identify who you are when you are initialising the website for the first time.
  // You can also put this in your Vercel's environment variable 'NEXT_PUBLIC_USER_PRINCIPLE_NAME' if you worry about
  // your email being exposed in public.
  userPrincipalName: process.env.NEXT_PUBLIC_USER_PRINCIPLE_NAME || 'admin@example.com',

  // [OPTIONAL] This is the website icon to the left of the title inside the navigation bar. It should be placed under the
  // /public directory of your GitHub project, and referenced here by its relative path to /public.
  icon: '/icons/128.png',

  // Prefix for KV Storage
  kvPrefix: process.env.KV_PREFIX || '',

  // The name of your website. Present alongside your icon.
  title: "File Storage Index",

  // The folder that you are to share publicly. Use '/' if you want to share your root folder.
  baseDirectory: '/',

  // [OPTIONAL] This represents the maximum number of items that one directory lists, pagination supported.
  maxItems: 100,

  // [OPTIONAL] We use Google Fonts natively for font customisations.
  // You can check and generate the required links and names at https://fonts.google.com.
  // googleFontSans - the sans serif font used in file-storage-index.
  googleFontSans: 'Inter',
  // googleFontMono - the monospace font used in file-storage-index.
  googleFontMono: 'Fira Mono',
  // googleFontLinks -  an array of links for referencing the google font assets.
  googleFontLinks: ['https://fonts.googleapis.com/css2?family=Fira+Mono&family=Inter:wght@400;500;700&display=swap'],

  // [OPTIONAL] The footer component of your website. You can write HTML here, but need to escape double
  // quotes - changing " to \". If you write multiline strings here, make sure you add \ at the end
  // of each line to escape the line break.
  footer:
    'Powered by <a href="https://github.com/doandat943/file-storage-index" target="_blank" rel="noopener noreferrer">File Storage Index</a>. Made with ❤ by doandat943.',

  // [OPTIONAL] This is where you specify the folders that are password protected. It is an array of paths pointing to all
  // the directories that you have protected. You must point to a directory, not a file.
  // Each path must start with '/' and must not contain any trailing slashes.
  protectedRoutes: ['/protected'],

  // [OPTIONAL] Use "" here if you want to remove this email address from the nav bar.
  email: '',

  // [OPTIONAL] This is an array of names and links for setting your social information and links.
  // In the latest update, all brand icons inside font awesome is supported and the icon to render is based on the name
  // you provide.
  links: [
    {
      name: 'GitHub',
      link: 'https://github.com/doandat943/file-storage-index',
    },
  ],

  // [OPTIONAL] This is an array of names of supported themes in lowercases. If your theme is in this array,
  // then the website will automatically apply the theme (background and text colours) to the entire website.
  // Available themes: cerulean, cosmo, cyborg, darkly, flatly, journal, litera, lumen, lux, materia, minty, morph,
  // pulse, quartz, sandstone, simplex, sketchy, slate, solar, spacelab, superhero, united, vapor, yeti, zephyr
  // Reference: https://bootswatch.com
  // Pro-tip: You can pass in an empty array [] to completely disable theming or if you are going to implement your own theme.
  themes: ['darkly', 'flatly', 'litera', 'materia', 'minty'],

  // [OPTIONAL] This is an array of file extensions. Files with these file extensions will be opened in a new tab.
  // Typical examples: ['.pdf', '.docx', '.xlsx', '.pptx', '.jpg', '.mp4'] and many more.
  // Applicable to simple text files, source code files (e.g. .c), PDFs, documents, images, audio, video, etc.
  openInNewTab: ['.pdf'],

  // [OPTIONAL] This is the name to the icon library you want to use. By default, we use RemixIcon.
  // But if you want to use FontAwesome, you can replace 'remix' with 'fontawesome'.
  // If you have selected 'fontawesome', then remember to install the dependency with npm/yarn.
  // And import the CSS in the _app.tsx file.
  iconLibrary: 'remix',

  // [OPTIONAL] This is a switch to determine whether we should show the last modified date of a file in the file list
  // token. If set to true, the last modified date will be shown in the file list item.
  lastModifiedInFileList: true,

  // [OPTIONAL] This is a switch to determine whether we should show the last modified date of a file in the file
  // information. If set to true, the last modified date will be shown in the file information.
  lastModifiedInFileInfo: true,

  // [OPTIONAL] Check if your password is exposed in data breaches.
  checkRevokedPwd: true,

  // [OPTIONAL] Whether the preview of supported files is enabled.
  preview: {
    image: true, // image: .png, .jpg, .jpeg, etc.
    markdown: true, // markdown: .md, .mdown, .markdown, etc.
    pdf: true, // pdf: .pdf
    text: true, // text: .txt, .ini, etc.
    code: true, // code: .js, .jsx, .ts, .tsx, .json, etc.
    video: true, // video: .mp4, .webm, etc. (with streaming)
    audio: true, // audio: .mp3, .wave, etc. (with streaming)
    office: true, // office: .docx, .xlsx, .pptx
  },

  // [OPTIONAL] Whether the dropdown is disabled when previewing supported files.
  disableDownloadDropdown: {
    image: false, // image: .png, .jpg, .jpeg, etc.
    markdown: false, // markdown: .md, .mdown, .markdown, etc.
    pdf: false, // pdf: .pdf
    text: false, // text: .txt, .ini, etc.
    code: false, // code: .js, .jsx, .ts, .tsx, .json, etc.
    video: false, // video: .mp4, .webm, etc.
    audio: false, // audio: .mp3, .wave, etc.
    office: false, // office: .docx, .xlsx, .pptx
  },

  // [OPTIONAL] Search configurations
  search: {
    // Whether search is enabled
    enabled: true,
    // Maximum number of search results displayed
    maxResults: 50,
  },
}
