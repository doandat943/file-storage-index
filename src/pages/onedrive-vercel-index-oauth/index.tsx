import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

export default function LocalStoragePage() {
  const router = useRouter()

  // Redirect to home page after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/')
    }, 5000)
    
    return () => clearTimeout(timer)
  }, [router])

  return (
    <>
      <Head>
        <title>Local Storage Mode - No OAuth Required</title>
      </Head>

      <div className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center space-y-8 p-4">
        <div>
          <div className="mb-4 text-xl font-medium text-gray-700">Local Storage Mode</div>
          <div className="rounded-lg border border-gray-900/10 bg-white px-6 py-8 shadow-md">
            <h3 className="text-xl font-medium text-gray-900">No OAuth Authentication Required</h3>
            <p className="mt-4 text-sm text-gray-500">
              This application is now configured to use local file storage instead of OneDrive.
              <br />
              OAuth authentication is no longer needed. You can manage files directly from the server.
            </p>
            <p className="mt-4 text-sm text-gray-500">
              You will be redirected to the home page shortly...
            </p>
            <div className="mt-6">
              <button
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
                onClick={() => router.push('/')}
              >
                Go to Home Page
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 