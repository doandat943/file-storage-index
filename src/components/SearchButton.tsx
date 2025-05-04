import { useTranslation } from 'next-i18next'
import useDeviceOS from '../utils/useDeviceOS'

export function SearchButton({ onClick }: { onClick: () => void }) {
  const os = useDeviceOS()
  const { t } = useTranslation()
  
  return (
    <div
      className="flex cursor-pointer flex-row items-center space-x-3 rounded-full bg-gray-200 px-3 py-1.5 transition-all duration-500 ease-in-out hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
      onClick={onClick}
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          onClick()
        }
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="h-5 w-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
        />
      </svg>

      <div className="flex-1 text-sm">{t('Search')}</div>

      <div className="flex flex-row space-x-1">
        <div className="rounded-sm border border-gray-400 px-1.5 text-xs dark:border-gray-500">
          {os === 'mac' ? '⌘' : 'Ctrl'}
        </div>
        <div className="rounded-sm border border-gray-400 px-1.5 text-xs dark:border-gray-500">
          K
        </div>
      </div>
    </div>
  )
} 