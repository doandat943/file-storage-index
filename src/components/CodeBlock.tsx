import { FC, useState } from 'react'
import { LightAsync as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrowNight as darkStyle } from 'react-syntax-highlighter/dist/cjs/styles/hljs'
import { github as lightStyle } from 'react-syntax-highlighter/dist/cjs/styles/hljs'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

export interface CodeBlockProps {
  language: string
  code: string
  theme: 'light' | 'dark'
}

const CodeBlock: FC<CodeBlockProps> = ({ language, code, theme }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  const styleObj = theme === 'dark' ? darkStyle : lightStyle
  const hljsBase: any = styleObj?.hljs || {}
  const buttonColor = hljsBase.color || 'inherit'

  return (
    <div className="fsi-codeblock">
      <button
        onClick={handleCopy}
        aria-label={copied ? 'Copied' : 'Copy'}
        className="fsi-copy-btn"
        style={{ color: buttonColor }}
      >
        <FontAwesomeIcon icon={copied ? ['fas','check'] : ['far','copy']} style={{ fontSize: '15px' }} />
      </button>
      <SyntaxHighlighter
        language={language}
        style={styleObj}
        PreTag="pre"
        customStyle={{ margin: 0 }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}

export default CodeBlock


