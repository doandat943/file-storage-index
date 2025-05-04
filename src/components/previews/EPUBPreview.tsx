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

const fixEpub = async (url: string) => {
  // Some EPUB books seem to have a corrupted mimetype entry, which causes an error when trying to read it
  // Fix it with this workaround referring to https://github.com/gerhardsletten/react-reader/issues/33#issuecomment-673964948
  const response = await fetch(url)
  const ab = await response.arrayBuffer()
  return ab
}

const EPUBPreview: FC<{ file: OdFileObject }> = ({ file }) => {
  const { asPath } = useRouter()
  const hashedToken = getStoredToken(asPath)

  const [epubURL, setEpubURL] = useState<string | undefined>('')
  const [location, setLocation] = useState<string>('0')
  const renditionRef = useRef<any>(null)
  const [localFile, setLocalFile] = useState<ArrayBuffer | undefined>(undefined)
  const { t } = useTranslation()

  const onLocationChange = (cfiStr: string) => {
    setLocation(cfiStr)
  }

  useEffect(() => {
    fetch(file['@microsoft.graph.downloadUrl'])
      .then(res => res.blob())
      .then(blob => {
        setEpubURL(URL.createObjectURL(blob))
      })

    return () => {
      if (epubURL) URL.revokeObjectURL(epubURL)
    }
  }, [file])

  useEffect(() => {
    if (epubURL) {
      fixEpub(epubURL).then(ab => {
        setLocalFile(ab)
      })
    }
  }, [epubURL])

  if (!epubURL || !localFile) {
    return (
      <>
        <PreviewContainer>
          <Loading loadingText={t('Loading EPUB file...')} />
        </PreviewContainer>
        <DownloadBtnContainer>
          <DownloadButtonGroup />
        </DownloadBtnContainer>
      </>
    )
  }

  return (
    <>
      <PreviewContainer>
        <div style={{ height: '80vh' }}>
          <ReactReader
            url={localFile}
            location={location}
            locationChanged={onLocationChange}
            getRendition={rendition => {
              renditionRef.current = rendition
              rendition.themes.fontSize('140%')
            }}
            epubInitOptions={{ openAs: 'array' }}
            readerStyles={ReactReaderStyle}
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
