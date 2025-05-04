import axios from 'axios'
import { useEffect, useState } from 'react'
import { getStoredToken } from './protectedRouteHandler'

/**
 * Custom hook for axios to fetch file content or folder listings on component mount
 * @param fetchUrl The URL pointing to the content to fetch
 * @param path The path of the file/folder, used for determining whether path is protected
 */
export default function useFileContent(
  fetchUrl: string,
  path: string
): { response: any; error: string; validating: boolean } {
  const [response, setResponse] = useState<any>(null)
  const [validating, setValidating] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const hashedToken = getStoredToken(path)
    const url = fetchUrl + (hashedToken ? `&odpt=${hashedToken}` : '')

    axios
      // Use blob response type to handle both text and JSON responses
      .get(url, { responseType: 'blob' })
      .then(async res => {
        const content = await res.data.text()
        try {
          // Try to parse as JSON first (for folder listings)
          const jsonData = JSON.parse(content)
          setResponse(jsonData.value || jsonData)
        } catch (e) {
          // If not JSON, return as text (for file content)
          setResponse(content)
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setValidating(false))
  }, [fetchUrl, path])
  
  return { response, error, validating }
}
