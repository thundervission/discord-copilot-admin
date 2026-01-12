import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Force Node.js runtime for pdf-parse compatibility
export const runtime = 'nodejs'

// Lazy load pdf-parse (Gemini is imported above as it's tree-shakable/mostly types in modern JS, but fine to leave)
export async function POST(req: NextRequest) {
    try {
        const supabase = createClient()

        // Check auth
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const formData = await req.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        // Convert file to Buffer
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Dynamic import/require
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdf = require('pdf-parse')

        // Parse PDF
        const data = await pdf(buffer)
        const text = data.text

        if (!text || text.trim().length === 0) {
            return NextResponse.json({ error: 'Could not extract text from PDF' }, { status: 400 })
        }

        // Chunk text (~500 chars)
        const chunkSize = 500
        const chunks: string[] = []
        const cleanText = text.replace(/\s+/g, ' ').trim()
        for (let i = 0; i < cleanText.length; i += chunkSize) {
            chunks.push(cleanText.slice(i, i + chunkSize))
        }

        // Init Gemini
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
        const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

        // Generate embeddings and insert
        const insertPromises = chunks.map(async (chunk) => {
            const result = await model.embedContent(chunk);
            const embedding = result.embedding.values;

            return supabase.from('knowledge_chunks').insert({
                content: chunk,
                embedding: embedding,
            })
        })

        await Promise.all(insertPromises)

        return NextResponse.json({ success: true, chunksProcessed: chunks.length })
    } catch (error: unknown) {
        console.error('PDF Upload Error:', error)
        const errorMessage = error instanceof Error ? error.message : String(error)
        return NextResponse.json({ error: errorMessage }, { status: 500 })
    }
}
