import { FC, ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkGemoji from 'remark-gemoji'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import { remarkAlert } from 'remark-github-blockquote-alert'
import { useTranslation } from 'next-i18next'
import CodeBlock from '../CodeBlock'

import 'katex/dist/katex.min.css'

import useFileContent from '../../utils/fetchOnMount'
import FourOhFour from '../FourOhFour'
import Loading from '../Loading'
import DownloadButtonGroup from '../DownloadBtnGtoup'
import { DownloadBtnContainer, PreviewContainer } from './Containers'
import { useTheme } from '../../utils/useTheme'

const MarkdownPreview: FC<{
  file: any
  path: string
  standalone?: boolean
}> = ({ file, path, standalone = true }) => {
  const { resolvedTheme } = useTheme()
  // The parent folder of the markdown file, which is also the relative image folder
  const parentPath = standalone ? path.substring(0, path.lastIndexOf('/')) : path

  const { response: content, error, validating } = useFileContent(`/api/raw/?path=${parentPath}/${file.name}`, path)
  const { t } = useTranslation()

  // Check if the image is relative path instead of a absolute url
  const isUrlAbsolute = (url: string | string[]) => {
    if (typeof url === 'string') return url.indexOf('://') > 0 || url.indexOf('//') === 0
    return false
  }

  const CodeBlockWithCopy: FC<{ language: string; code: string }> = ({ language, code }) => (
    <CodeBlock language={language} code={code} theme={resolvedTheme === 'dark' ? 'dark' : 'light'} />
  )

  if (error) {
    return (
      <PreviewContainer>
        <FourOhFour errorMsg={error} />
      </PreviewContainer>
    )
  }
  if (validating) {
    return (
      <>
        <PreviewContainer>
          <Loading loadingText={t('Loading file content...')} />
        </PreviewContainer>
        {standalone && (
          <DownloadBtnContainer>
            <DownloadButtonGroup />
          </DownloadBtnContainer>
        )}
      </>
    )
  }

  return (
    <div>
      <PreviewContainer>
        <div className={`markdown-body ${resolvedTheme}`}>
          {/* Using rehypeRaw to render HTML inside Markdown is potentially dangerous, use under safe environments. (#18) */}
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath, remarkAlert, remarkGemoji]}
            rehypePlugins={[rehypeKatex, rehypeRaw]}
            components={{
              img: ({ node, ...props }) => {
                const srcStr = typeof props.src === 'string' ? props.src : ''
                const imgSrc = isUrlAbsolute(srcStr) ? srcStr : `/api/?path=${parentPath}/${srcStr}&raw=true`
                
                return (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imgSrc}
                    alt={props.alt}
                    title={props.title}
                    width={props.width}
                    height={props.height}
                  />
                )
              },
              code: ({ node, className, children }) => {
                const match = /language-(\w+)/.exec(className || '')
                if (!match) {
                  return <code className={className}>{children}</code>
                }
                
                return (
                  <CodeBlockWithCopy 
                    language={match[1]} 
                    code={String(children).replace(/\n$/, '')}
                  />
                )
              }
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </PreviewContainer>
      {standalone && (
        <DownloadBtnContainer>
          <DownloadButtonGroup />
        </DownloadBtnContainer>
      )}
    </div>
  )
}

export default MarkdownPreview
