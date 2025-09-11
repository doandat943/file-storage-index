
import type { AppProps } from 'next/app'
import NextNProgress from 'nextjs-progressbar'
import { appWithTranslation } from 'next-i18next'
import { Analytics } from '@vercel/analytics/react';
import { CookiesProvider } from 'react-cookie'

import '../styles/globals.css'
import '../styles/markdown-github.css'
import '@fortawesome/fontawesome-svg-core/styles.css'

// FontAwesome configuration for v3.x - using require() for compatibility
import { config } from '@fortawesome/fontawesome-svg-core'
config.autoAddCss = false

// Use require for library to ensure proper SSR support
const { library } = require('@fortawesome/fontawesome-svg-core')

// Import all icon packages using require for stability
const solidIcons = require('@fortawesome/free-solid-svg-icons')
const regularIcons = require('@fortawesome/free-regular-svg-icons') 
const brandIcons = require('@fortawesome/free-brands-svg-icons')

// Add all icons from solid pack
Object.keys(solidIcons).forEach(key => {
  if (key !== 'fas' && key !== 'prefix' && solidIcons[key].iconName) {
    library.add(solidIcons[key])
  }
})

// Add all icons from regular pack
Object.keys(regularIcons).forEach(key => {
  if (key !== 'far' && key !== 'prefix' && regularIcons[key].iconName) {
    library.add(regularIcons[key])
  }
})

// Add all icons from brand pack
Object.keys(brandIcons).forEach(key => {
  if (key !== 'fab' && key !== 'prefix' && brandIcons[key].iconName) {
    library.add(brandIcons[key])
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
