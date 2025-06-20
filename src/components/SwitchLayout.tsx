import { Fragment } from 'react'
import { IconProp } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Listbox, Transition } from '@headlessui/react'
import { useTranslation } from 'next-i18next'

import useCookieStorage from '../utils/useCookieStorage'

export const layouts: Array<{ id: number; name: 'Grid' | 'List'; icon: IconProp }> = [
  { id: 1, name: 'List', icon: 'th-list' },
  { id: 2, name: 'Grid', icon: 'th' },
]

const SwitchLayout = () => {
  const [preferredLayout, setPreferredLayout] = useCookieStorage('preferredLayout', layouts[0])

  const { t } = useTranslation()

  return (
    <div className="relative flex-shrink-0 text-sm text-gray-600 dark:text-gray-300">
      <Listbox value={preferredLayout} onChange={setPreferredLayout}>
        <Listbox.Button className="relative flex min-w-0 cursor-pointer items-center rounded pl-3 pr-8">
          <FontAwesomeIcon className="mr-2 h-3 w-3 flex-shrink-0" icon={preferredLayout.icon} />
          <span className="hidden truncate sm:block">
            {t(preferredLayout.name)}
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <FontAwesomeIcon className="h-3 w-3" icon="chevron-down" />
          </span>
        </Listbox.Button>

        <Transition
          as={Fragment}
          enter="transition duration-100 ease-out"
          enterFrom="transform scale-95 opacity-0"
          enterTo="transform scale-100 opacity-100"
          leave="transition duration-75 ease-out"
          leaveFrom="transform scale-100 opacity-100"
          leaveTo="transform scale-95 opacity-0"
        >
          <Listbox.Options className="absolute right-0 z-20 mt-1 min-w-[8rem] overflow-auto rounded border border-gray-900/10 bg-white py-1 shadow-lg focus:outline-none dark:border-gray-500/30 dark:bg-gray-800">
            {layouts.map(layout => (
              <Listbox.Option
                key={layout.id}
                className={`${
                  layout.name === preferredLayout.name &&
                  'bg-blue-50 text-blue-700 dark:bg-blue-600/10 dark:text-blue-400'
                } relative flex cursor-pointer select-none items-center py-1.5 pl-3 pr-8 text-gray-600 hover:opacity-80 dark:text-gray-300`}
                value={layout}
              >
                <FontAwesomeIcon className="mr-2 h-3 w-3 flex-shrink-0" icon={layout.icon} />
                <span className={`truncate ${layout.name === preferredLayout.name ? 'font-medium' : 'font-normal'}`}>
                  {t(layout.name)}
                </span>
                {layout.name === preferredLayout.name && (
                  <span className="absolute inset-y-0 right-3 flex items-center">
                    <FontAwesomeIcon className="h-3 w-3" icon="check" />
                  </span>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </Listbox>
    </div>
  )
}

export default SwitchLayout
