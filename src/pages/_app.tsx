
import type { AppProps } from 'next/app'
import NextNProgress from 'nextjs-progressbar'
import { appWithTranslation } from 'next-i18next'
import { Analytics } from '@vercel/analytics/react';
import { CookiesProvider } from 'react-cookie'

import '../styles/globals.css'
import '../styles/markdown-github.css'
import 'remark-github-blockquote-alert/alert.css'
import '@fortawesome/fontawesome-svg-core/styles.css'

import { library, config } from '@fortawesome/fontawesome-svg-core'
config.autoAddCss = false

// Import the most common packages using require for better compatibility
const solidIcons = require('@fortawesome/free-solid-svg-icons')
const regularIcons = require('@fortawesome/free-regular-svg-icons') 
const brandIcons = require('@fortawesome/free-brands-svg-icons')

// Add common icons that are frequently used
const commonSolidIcons = [
  'faSearch', 'faChevronDown', 'faDesktop', 'faThList', 'faAngleRight',
  'faCheck', 'faPlus', 'faMinus', 'faDownload', 'faMusic', 'faArrowLeft',
  'faArrowRight', 'faFileDownload', 'faUndo', 'faBook', 'faKey',
  'faSignOutAlt', 'faCloud', 'faChevronCircleDown', 'faLink',
  'faExternalLinkAlt', 'faExclamationCircle', 'faExclamationTriangle',
  'faTh', 'faThLarge', 'faHome', 'faLanguage', 'faCircleNotch',
  'faSun', 'faMoon', 'faPen', 'faCopy'
]

const commonRegularIcons = [
  'faFileImage', 'faFilePdf', 'faFileWord', 'faFilePowerpoint',
  'faFileExcel', 'faFileAudio', 'faFileVideo', 'faFileArchive',
  'faFileCode', 'faFileAlt', 'faFile', 'faFolder', 'faCopy',
  'faArrowAltCircleDown', 'faTrashAlt', 'faEnvelope', 'faFlag',
  'faCheckCircle'
]

const commonBrandIcons = [
  'faGithub', 'faTwitter', 'faFacebook', 'faInstagram', 'faLinkedin',
  'faYoutube', 'faTelegram', 'faDiscord', 'faReddit', 'faMarkdown'
]

// Add common solid icons
commonSolidIcons.forEach(iconName => {
  if (solidIcons[iconName]) {
    library.add(solidIcons[iconName])
  }
})

// Add common regular icons
commonRegularIcons.forEach(iconName => {
  if (regularIcons[iconName]) {
    library.add(regularIcons[iconName])
  }
})

// Add common brand icons
commonBrandIcons.forEach(iconName => {
  if (brandIcons[iconName]) {
    library.add(brandIcons[iconName])
  }
})

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <CookiesProvider>
      <NextNProgress height={1} color="rgb(156, 163, 175, 0.9)" options={{ showSpinner: false }} />
      <Analytics />
      <Component {...pageProps} />
    </CookiesProvider>
  )
}
export default appWithTranslation(MyApp)
