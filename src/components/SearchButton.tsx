import { useTranslation } from 'next-i18next'
import useDeviceOS from '../utils/useDeviceOS'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

export function SearchButton({ onClick }: { onClick: () => void }) {
  const os = useDeviceOS()
  const { t } = useTranslation()
  
  return (
    <button
      className="flex flex-1 items-center justify-between rounded-lg bg-gray-100 px-2.5 py-1.5 hover:opacity-80 dark:bg-gray-800 dark:text-white md:w-48"
      onClick={onClick}
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          onClick()
        }
      }}
    >
      <div className="flex items-center space-x-2">
        <FontAwesomeIcon className="h-4 w-4" icon="search" />
        <span className="truncate text-sm font-medium">{t('Search ...')}</span>
      </div>

      <div className="hidden items-center space-x-1 md:flex">
        <div className="rounded-lg bg-gray-200 px-2 py-1 text-xs font-medium dark:bg-gray-700">
          {os === 'mac' ? '⌘' : 'Ctrl'}
        </div>
        <div className="rounded-lg bg-gray-200 px-2 py-1 text-xs font-medium dark:bg-gray-700">K</div>
      </div>
    </button>
  )
} 