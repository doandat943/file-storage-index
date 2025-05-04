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
      className={`mt-auto flex w-full flex-col space-y-4 bg-white p-3 dark:bg-gray-900 dark:text-gray-50 md:flex-row md:items-center md:space-y-0 md:space-x-3 md:p-5 ${className}`}
    >
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-3">
        <div>
          <div dangerouslySetInnerHTML={{ __html: siteConfig.footer }}></div>
        </div>
      </div>
    </div>
  )
}

export default Footer
