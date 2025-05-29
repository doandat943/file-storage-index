import Head from 'next/head'
import { ReactNode } from 'react'

import siteConfig from '../../config/site.config'
import Navbar from './Navbar'
import Footer from './Footer'
import Breadcrumb from './Breadcrumb'
import SwitchLayout from './SwitchLayout'

interface PageLayoutProps {
  children: ReactNode
  query?: any
}

const PageLayout = ({ children, query }: PageLayoutProps) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white dark:bg-gray-900">
      <Head>
        <title>{siteConfig.title}</title>
      </Head>

      <main className="flex w-full flex-1 flex-col bg-gray-50 dark:bg-gray-800">
        <Navbar />
        <div className="mx-auto w-full max-w-5xl py-4 sm:p-4">
          <nav className="mb-4 flex items-center justify-between space-x-3 px-4 sm:px-0 sm:pl-1">
            <Breadcrumb query={query} />
            <SwitchLayout />
          </nav>
          {children}
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default PageLayout 