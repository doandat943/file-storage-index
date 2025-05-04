import type { OdFileObject } from '../../types'
import { FC } from 'react'
import { useRouter } from 'next/router'

import DownloadButtonGroup from '../DownloadBtnGtoup'
import { DownloadBtnContainer } from './Containers'
import { getBaseUrl } from '../../utils/getBaseUrl'
import { getStoredToken } from '../../utils/protectedRouteHandler'

const OfficePreview: FC<{ file: OdFileObject }> = ({ file }) => {
  const { asPath } = useRouter()
  const hashedToken = getStoredToken(asPath)

  const rawFileUrl = `${getBaseUrl()}/api/raw/?path=${asPath}${hashedToken ? `&odpt=${hashedToken}` : ''}`

  return (
    <div>
      <div className="flex flex-col items-center justify-center p-5 mb-4 bg-white rounded shadow dark:bg-gray-800">
        <p className="mb-4 text-center">
          Office file preview is not available in this version. Please download the file to view it.
        </p>
        <a 
          href={rawFileUrl}
          className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
          target="_blank"
          rel="noopener noreferrer"
        >
          Download File
        </a>
      </div>
      <DownloadBtnContainer>
        <DownloadButtonGroup />
      </DownloadBtnContainer>
    </div>
  )
}

export default OfficePreview
