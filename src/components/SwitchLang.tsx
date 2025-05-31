import React, { Fragment } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Menu, MenuButton, MenuItems, MenuItem, Transition } from '@headlessui/react'
import { useLanguage } from '../utils/useLanguage'
import 'flag-icons/css/flag-icons.min.css'

const locales = ['de-DE', 'en-US', 'es-ES', 'zh-CN', 'hi-IN', 'id-ID', 'tr-TR', 'vi-VN', 'zh-TW']

const localeFlag = (locale: string): React.ReactElement => {
  const getCountryCode = (locale: string): string => {
    switch (locale) {
      case 'de-DE':
        return 'de'
      case 'en-US':
        return 'us'
      case 'es-ES':
        return 'es'
      case 'zh-CN':
        return 'cn'
      case 'hi-IN':
        return 'in'
      case 'id-ID':
        return 'id'
      case 'tr-TR':
        return 'tr'
      case 'vi-VN':
        return 'vn'
      case 'zh-TW':
        return 'tw'
      default:
        return 'us'
    }
  }
  
  return <span className={`fi fi-${getCountryCode(locale)} w-5 h-4 inline-block rounded-sm`}></span>
}

const localeText = (locale: string): React.ReactElement => {
  const getText = (locale: string): string => {
    switch (locale) {
      case 'de-DE':
        return 'Deutsch'
      case 'en-US':
        return 'English'
      case 'es-ES':
        return 'Español'
      case 'zh-CN':
        return '简体中文'
      case 'hi-IN':
        return 'हिन्दी'
      case 'id-ID':
        return 'Indonesia'
      case 'tr-TR':
        return 'Türkçe'
      case 'vi-VN':
        return 'Tiếng Việt'
      case 'zh-TW':
        return '繁體中文'
      default:
        return 'English'
    }
  }
  
  return (
    <span className="flex items-center space-x-2">
      {localeFlag(locale)}
      <span>{getText(locale)}</span>
    </span>
  )
}

const SwitchLang = () => {
  const { currentLocale, changeLanguage, isChanging } = useLanguage()

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
            >
              <span className="select-none">
                {localeFlag(currentLocale)}
              </span>
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
                    Select Language
                  </div>
                </div>
                <div className="border-t border-gray-100 dark:border-gray-700"></div>
                <div className="py-1">
                  {locales.map((locale) => (
                    <MenuItem key={locale}>
                      {({ focus }) => (
                        <button
                          className={`${
                            focus ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                          } ${
                            currentLocale === locale ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : ''
                          } ${
                            isChanging ? 'opacity-50 cursor-not-allowed' : 'hover:pl-5'
                          } group flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium transition-all duration-150 focus:outline-none`}
                          onClick={() => changeLanguage(locale)}
                          disabled={isChanging}
                        >
                          <span className="select-none">{localeText(locale)}</span>
                          {currentLocale === locale && (
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

export default SwitchLang
