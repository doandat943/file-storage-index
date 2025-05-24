import axios from 'axios'
import useSWR, { SWRResponse } from 'swr'
import { Dispatch, Fragment, SetStateAction, useState } from 'react'
import AwesomeDebouncePromise from 'awesome-debounce-promise'
import { useAsync } from 'react-async-hook'
import useConstant from 'use-constant'
import { useTranslation } from 'next-i18next'

import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Dialog, Transition } from '@headlessui/react'

import type { DriveItem, SearchResult } from '../types'
import { LoadingIcon } from './Loading'

import { getFileIcon } from '../utils/getFileIcon'
import { fetcher } from '../utils/fetchWithSWR'
import siteConfig from '../../config/site.config'

/**
 * Create absolute path from relative path
 *
 * @param path Item path
 * @returns Absolute path of the item in search results
 */
function createAbsolutePath(path: string): string {
  // Process base path
  const basePath = siteConfig.baseDirectory === '/' ? '' : siteConfig.baseDirectory
  
  // Concatenate with base path
  const fullPath = basePath + (path.startsWith('/') ? path : '/' + path)
  
  // Encode path components
  return fullPath
    .split('/')
    .map(p => p && encodeURIComponent(decodeURIComponent(p)))
    .join('/')
}

/**
 * Search hook with debounce
 * @returns React hook for debounced async search
 */
function useItemSearch() {
  const [query, setQuery] = useState('')
  
  const searchItems = async (q: string) => {
    const { data } = await axios.get<SearchResult>(`/api/search/?q=${q}`)
    return data
  }

  const debouncedItemSearch = useConstant(() => AwesomeDebouncePromise(searchItems, 1000))
  
  const results = useAsync(async () => {
    if (query.length === 0) {
      return []
    } else {
      return debouncedItemSearch(query)
    }
  }, [query])

  return {
    query,
    setQuery,
    results,
  }
}

function SearchResultItemTemplate({
  item,
  itemPath,
  itemDescription,
  disabled,
}: {
  item: SearchResult[number]
  itemPath: string
  itemDescription: string
  disabled: boolean
}) {
  return (
    <Link
      href={itemPath}
      passHref
      className={`flex items-center space-x-4 border-b border-gray-400/30 px-4 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-850 ${
        disabled ? 'pointer-events-none cursor-not-allowed' : 'cursor-pointer'
      }`}
    >
      <FontAwesomeIcon icon={item.file ? getFileIcon(item.name) : ['far', 'folder']} />
      <div>
        <div className="text-sm font-medium leading-8">{item.name}</div>
        <div
          className={`overflow-hidden truncate font-mono text-xs opacity-60 ${
            itemDescription === 'Loading ...' && 'animate-pulse'
          }`}
        >
          {itemDescription}
        </div>
      </div>
    </Link>
  )
}

function SearchResultItem({ result }: { result: SearchResult[number] }) {
  const { t } = useTranslation()
  
  // Path is not empty, can be displayed directly
  const decodedPath = decodeURIComponent(result.path)
  return (
    <SearchResultItemTemplate
      item={result}
      itemPath={result.path}
      itemDescription={decodedPath}
      disabled={false}
    />
  )
}

export default function SearchModal({
  searchOpen,
  setSearchOpen,
}: {
  searchOpen: boolean
  setSearchOpen: Dispatch<SetStateAction<boolean>>
}) {
  const { query, setQuery, results } = useItemSearch()

  const { t } = useTranslation()

  const closeSearchBox = () => {
    setSearchOpen(false)
    setQuery('')
  }

  return (
    <Transition appear show={searchOpen} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-[200] overflow-y-auto" onClose={closeSearchBox}>
        <div className="min-h-screen px-4 text-center">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-100"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-gray-50/90 dark:bg-gray-800/90" />
          </Transition.Child>

          {/* Dialog position */}
          <div className="fixed left-1/2 top-0 -translate-x-1/2 pt-16">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-100"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-100"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div className="my-auto w-full max-w-3xl rounded bg-white p-5 text-left shadow-xl dark:bg-gray-900 dark:text-white">
                <div className="relative">
                  <input
                    className="w-full rounded-lg border border-gray-400/30 bg-gray-50 px-4 py-3 pr-10 text-gray-700 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-gray-600/30 dark:bg-gray-800 dark:text-gray-300"
                    type="text"
                    placeholder={t('Search ...')}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    {query === '' || (results.result && results.result.length === 0) ? (
                      <div className="flex items-center space-x-2 whitespace-nowrap rounded-full bg-gray-200/50 px-3 py-1 dark:bg-gray-700">
                        <span className="text-xs text-gray-600 dark:text-gray-400">{t('ESC')}</span>
                      </div>
                    ) : !results.result ? (
                      <LoadingIcon className="inline-block h-6 w-6 animate-spin" />
                    ) : (
                      <div className="flex items-center space-x-2 whitespace-nowrap rounded-full bg-gray-200/50 px-3 py-1 dark:bg-gray-700">
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {results.result.length} {t('result(s) found')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Search results */}
                {query !== '' && results.result && results.result.length > 0 && (
                  <div className="relative mt-5 max-h-96 overflow-auto">
                    {results.result.map(result => (
                      <SearchResultItem key={result.id} result={result} />
                    ))}
                  </div>
                )}
              </div>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
