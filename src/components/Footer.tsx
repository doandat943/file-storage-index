import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'

import siteConfig from '../../config/site.config'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

const Footer: React.FC<{ className?: string }> = ({ className }) => {
  const router = useRouter()
  const { t } = useTranslation()

  return (
    <div
      id="footer"
      className={`w-full border-t border-gray-200 bg-white p-4 text-center text-sm font-medium text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 ${className}`}
    >
      <div dangerouslySetInnerHTML={{ __html: siteConfig.footer }}></div>
    </div>
  )
}

export default Footer
