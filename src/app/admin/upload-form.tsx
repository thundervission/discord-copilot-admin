'use client'

import { useState } from 'react'

export default function UploadPdfForm() {
    const [status, setStatus] = useState<string>('')
    const [isLoading, setIsLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const file = formData.get('file') as File

        if (!file || file.size === 0) {
            setStatus('Please select a file.')
            return
        }

        setIsLoading(true)
        setStatus('Uploading and processing...')

        try {
            const res = await fetch('/api/upload-pdf', {
                method: 'POST',
                body: formData,
            })

            if (!res.ok) {
                const err = await res.text()
                throw new Error(err || res.statusText)
            }

            setStatus('Success! PDF processed and embeddings generated.');
            e.currentTarget.reset()
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err)
            setStatus(`Error: ${message}`)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-4">
                <input
                    type="file"
                    name="file"
                    accept="application/pdf"
                    className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
                />
            </div>

            {status && (
                <div className={`text-sm ${status.startsWith('Error') || status.startsWith('Please') ? 'text-red-600' : 'text-green-600'}`}>
                    {status}
                </div>
            )}

            <button
                type="submit"
                disabled={isLoading}
                className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-900 transition-colors disabled:opacity-50"
            >
                {isLoading ? 'Processing...' : 'Upload & Embed'}
            </button>
        </form>
    )
}
