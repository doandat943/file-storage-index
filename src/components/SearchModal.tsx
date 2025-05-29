import axios from 'axios'
import useSWR, { SWRResponse } from 'swr'
import { Dispatch, Fragment, SetStateAction, useState } from 'react'
import AwesomeDebouncePromise from 'awesome-debounce-promise'
import { useAsync } from 'react-async-hook'
import useConstant from 'use-constant'
import { useTranslation } from 'next-i18next'

import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle, Transition } from '@headlessui/react'

import type { DriveItem, SearchResult } from '../types'
import { LoadingIcon } from './Loading'

import { getFileIcon } from '../utils/getFileIcon'
import { fetcher } from '../utils/fetchWithSWR'
import siteConfig from '../../config/site.config'

/**
 * Implements search function returns a promise that resolves to an array of
 * search results.
 *
 * @returns A react hook for a debounced async search of the drive
 */
function useItemSearch() {
  const [query, setQuery] = useState('')
  const searchItem = async (q: string) => {
    const { data } = await axios.get<SearchResult>(`/api/search/?q=${q}`)
    return data
  }

  const debouncedItemSearch = useConstant(() => AwesomeDebouncePromise(searchItem, 1000))
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
  const itemPath = result.path
  return (
    <SearchResultItemTemplate
      item={result}
      itemPath={itemPath}
      itemDescription={decodeURIComponent(itemPath)}
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
            <DialogBackdrop className="fixed inset-0 bg-white/80 dark:bg-gray-800/80" />
          </Transition.Child>

          <Transition.Child
            as={Fragment}
            enter="ease-out duration-100"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-100"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="relative z-10 my-12 inline-block w-full max-w-3xl transform overflow-hidden rounded border border-gray-400/30 text-left shadow-xl transition-all">
              <DialogTitle
                as="h3"
                className="flex items-center space-x-4 border-b border-gray-400/30 bg-gray-50 p-4 dark:bg-gray-800 dark:text-white"
              >
                <FontAwesomeIcon icon="search" className="h-4 w-4" />
                <input
                  type="text"
                  id="search-box"
                  className="w-full bg-transparent focus:outline-none focus-visible:outline-none"
                  placeholder={t('Search ...')}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                />
                <div className="rounded-lg bg-gray-200 px-2 py-1 text-xs font-medium dark:bg-gray-700">ESC</div>
              </DialogTitle>
              <div
                className="max-h-[80vh] overflow-x-hidden overflow-y-scroll bg-white dark:bg-gray-900 dark:text-white"
                onClick={closeSearchBox}
              >
                {results.loading && (
                  <div className="px-4 py-12 text-center text-sm font-medium">
                    <LoadingIcon className="svg-inline--fa mr-2 inline-block h-4 w-4 animate-spin" />
                    <span>{t('Loading ...')}</span>
                  </div>
                )}
                {results.error && (
                  <div className="px-4 py-12 text-center text-sm font-medium">
                    {t('Error: {{message}}', { message: results.error.message })}
                  </div>
                )}
                {results.result && (
                  <>
                    {results.result.length === 0 ? (
                      <div className="px-4 py-12 text-center text-sm font-medium">{t('Nothing here.')}</div>
                    ) : (
                      results.result.map(result => <SearchResultItem key={result.id} result={result} />)
                    )}
                  </>
                )}
              </div>
            </DialogPanel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  )
}
