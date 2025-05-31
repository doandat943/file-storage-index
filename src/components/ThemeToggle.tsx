import { Fragment } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Menu, MenuButton, MenuItems, MenuItem, Transition } from '@headlessui/react'
import { useTranslation } from 'next-i18next'

import { useTheme } from '../utils/useTheme'

const themeOptions = [
  { 
    id: 'light' as const, 
    name: 'Light', 
    icon: 'sun' as const,
    description: 'Light theme'
  },
  { 
    id: 'dark' as const, 
    name: 'Dark', 
    icon: 'moon' as const,
    description: 'Dark theme'
  },
  { 
    id: 'system' as const, 
    name: 'System', 
    icon: 'desktop' as const,
    description: 'Follow system preference'
  },
]

const ThemeToggle = () => {
  const { currentTheme, changeTheme, isChanging } = useTheme()
  const { t } = useTranslation()

  const currentThemeOption = themeOptions.find(option => option.id === currentTheme) || themeOptions[2]

  return (
    <div className="relative">
      <Menu>
        {({ open }) => (
          <>
            <MenuButton 
              className={`flex h-8 items-center space-x-2 rounded-lg bg-gray-100 px-2 py-1.5 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-200 hover:shadow-sm focus:outline-none dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 md:px-2.5 ${
                isChanging ? 'opacity-75 cursor-wait' : ''
              }`}
              disabled={isChanging}
              title={currentThemeOption.description}
            >
              <FontAwesomeIcon
                className={`h-4 w-4 ${isChanging ? 'animate-spin' : ''}`}
                icon={isChanging ? "circle-notch" : currentThemeOption.icon}
              />
              <FontAwesomeIcon 
                className={`h-3 w-3 opacity-60 transition-transform duration-200 ${
                  isChanging ? 'animate-spin' : open ? 'rotate-180' : ''
                }`} 
                icon={isChanging ? "circle-notch" : "chevron-down"}
              />
            </MenuButton>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <MenuItems className="absolute right-0 top-full z-50 mt-2 w-48 origin-top-right rounded-lg bg-white py-2 shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800 dark:ring-gray-700">
                <div className="px-3 py-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {t('Theme')}
                  </div>
                </div>
                <div className="border-t border-gray-100 dark:border-gray-700"></div>
                <div className="py-1">
                  {themeOptions.map((option) => (
                    <MenuItem key={option.id}>
                      {({ focus }) => (
                        <button
                          className={`${
                            focus ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                          } ${
                            currentTheme === option.id ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : ''
                          } ${
                            isChanging ? 'opacity-50 cursor-not-allowed' : 'hover:pl-5'
                          } group flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium transition-all duration-150 focus:outline-none`}
                          onClick={() => changeTheme(option.id)}
                          disabled={isChanging}
                          title={option.description}
                        >
                          <div className="flex items-center space-x-3">
                            <FontAwesomeIcon
                              icon={option.icon}
                              className="h-4 w-4"
                            />
                            <span className="select-none">{t(option.name)}</span>
                          </div>
                          {currentTheme === option.id && (
                            <FontAwesomeIcon 
                              icon={isChanging ? "circle-notch" : "check"}
                              className={`h-3 w-3 text-blue-600 dark:text-blue-400 ${
                                isChanging ? 'animate-spin' : 'animate-pulse'
                              }`} 
                            />
                          )}
                        </button>
                      )}
                    </MenuItem>
                  ))}
                </div>
              </MenuItems>
            </Transition>
          </>
        )}
      </Menu>
    </div>
  )
}

export default ThemeToggle 