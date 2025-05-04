import type { OdFileObject } from '../../types'

import { FC, useEffect, useRef, useState } from 'react'
import { ReactReader, ReactReaderStyle } from 'react-reader'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'

import Loading from '../Loading'
import FourOhFour from '../FourOhFour'
import DownloadButtonGroup from '../DownloadBtnGtoup'
import { DownloadBtnContainer, PreviewContainer } from './Containers'
import { getStoredToken } from '../../utils/protectedRouteHandler'

const EPUBPreview: FC<{ file: OdFileObject }> = ({ file }) => {
  const { asPath } = useRouter()
  const hashedToken = getStoredToken(asPath)

  const [location, setLocation] = useState<string>('0')
  const renditionRef = useRef<any>(null)
  const { t } = useTranslation()

  const onLocationChange = (cfiStr: string) => {
    setLocation(cfiStr)
  }

  // Tạo API URL để truy cập trực tiếp file EPUB
  const apiUrl = `/api/raw/?path=${asPath}${hashedToken ? '&odpt=' + hashedToken : ''}`

  return (
    <>
      <PreviewContainer>
        <div style={{ height: '80vh' }}>
          <ReactReader
            url={apiUrl}
            location={location}
            locationChanged={onLocationChange}
            loadingView={<Loading loadingText={t('Loading EPUB file...')} />}
            getRendition={rendition => {
              renditionRef.current = rendition
              rendition.themes.fontSize('140%')
              
              // Fix for EPUB files with relative paths
              const spineGet = rendition.book.spine.get.bind(rendition.book.spine)
              rendition.book.spine.get = function(target: string) {
                let t = spineGet(target)
                if (t === null && typeof target === 'string') {
                  let newTarget = target
                  while (t === null && newTarget.startsWith('../')) {
                    newTarget = newTarget.substring(3)
                    t = spineGet(newTarget)
                  }
                }
                return t
              }
            }}
            epubOptions={{ flow: 'scrolled', allowPopups: true }}
          />
        </div>
      </PreviewContainer>
      <DownloadBtnContainer>
        <DownloadButtonGroup />
      </DownloadBtnContainer>
    </>
  )
}

export default EPUBPreview
