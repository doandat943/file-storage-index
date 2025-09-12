
import type { AppProps } from 'next/app'
import NextNProgress from 'nextjs-progressbar'
import { appWithTranslation } from 'next-i18next'
import { Analytics } from '@vercel/analytics/react';
import { CookiesProvider } from 'react-cookie'

import '../styles/globals.css'
import '../styles/markdown-github.css'
import '@fortawesome/fontawesome-svg-core/styles.css'

import { config } from '@fortawesome/fontawesome-svg-core'
config.autoAddCss = false

// Import FontAwesome library and icons
import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faSearch,
  faChevronDown,
  faDesktop,
  faThList,
  faAngleRight,
  faCheck,
  faPlus,
  faMinus,
  faDownload,
  faMusic,
  faArrowLeft,
  faArrowRight,
  faFileDownload,
  faUndo,
  faBook,
  faKey,
  faSignOutAlt,
  faCloud,
  faChevronCircleDown,
  faLink,
  faExternalLinkAlt,
  faExclamationCircle,
  faExclamationTriangle,
  faTh,
  faThLarge,
  faHome,
  faLanguage,
  faCircleNotch,
  faSun,
  faMoon,
  faPen,
  faCopy
} from '@fortawesome/free-solid-svg-icons'

import {
  faFileImage,
  faFilePdf,
  faFileWord,
  faFilePowerpoint,
  faFileExcel,
  faFileAudio,
  faFileVideo,
  faFileArchive,
  faFileCode,
  faFileAlt,
  faFile,
  faFolder,
  faCopy as faRegularCopy,
  faArrowAltCircleDown,
  faTrashAlt,
  faEnvelope,
  faFlag,
  faCheckCircle
} from '@fortawesome/free-regular-svg-icons'

import {
  faGithub,
  faTwitter,
  faFacebook,
  faInstagram,
  faLinkedin,
  faYoutube,
  faTelegram,
  faDiscord,
  faReddit,
  faMarkdown
} from '@fortawesome/free-brands-svg-icons'

// Add all icons to the library
library.add(
  // Solid icons
  faSearch,
  faChevronDown,
  faDesktop,
  faThList,
  faAngleRight,
  faCheck,
  faPlus,
  faMinus,
  faDownload,
  faMusic,
  faArrowLeft,
  faArrowRight,
  faFileDownload,
  faUndo,
  faBook,
  faKey,
  faSignOutAlt,
  faCloud,
  faChevronCircleDown,
  faLink,
  faExternalLinkAlt,
  faExclamationCircle,
  faExclamationTriangle,
  faTh,
  faThLarge,
  faHome,
  faLanguage,
  faCircleNotch,
  faSun,
  faMoon,
  faPen,
  faCopy,
  
  // Regular icons
  faFileImage,
  faFilePdf,
  faFileWord,
  faFilePowerpoint,
  faFileExcel,
  faFileAudio,
  faFileVideo,
  faFileArchive,
  faFileCode,
  faFileAlt,
  faFile,
  faFolder,
  faRegularCopy,
  faArrowAltCircleDown,
  faTrashAlt,
  faEnvelope,
  faFlag,
  faCheckCircle,
  
  // Brand icons
  faGithub,
  faTwitter,
  faFacebook,
  faInstagram,
  faLinkedin,
  faYoutube,
  faTelegram,
  faDiscord,
  faReddit,
  faMarkdown
)

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
