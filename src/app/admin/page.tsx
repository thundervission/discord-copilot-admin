import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { updateSettings, resetSummary } from './actions'

export default async function AdminPage() {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        // If not authenticated, we could redirect to login.
        // For now, let's just show a simple message or redirect to a login route if exists.
        // Since we don't have a login route yet, we'll just show "Unauthorized" or 
        // better, show a simple login form here? 
        // The user rules say "Requires Supabase Auth login".
        // I'll redirect to a login page I'll create next, or just render a Login component here?
        // Let's redirect to `/login`.
        redirect('/login')
    }

    // Fetch settings
    const { data: settings, error } = await supabase
        .from('agent_settings')
        .select('*')
        .limit(1)
        .single()

    if (error) {
        return <div className="p-8 text-red-500">Error loading settings: {error.message}. Please ensure the database is set up.</div>
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            <div className="max-w-4xl mx-auto space-y-8">
                <header className="flex justify-between items-center border-b pb-4">
                    <h1 className="text-3xl font-bold text-gray-900">Discord Copilot Admin</h1>
                    <div className="text-sm text-gray-500">Logged in as {user.email}</div>
                </header>

                {/* System Instructions & Channels Form */}
                <section className="bg-white p-6 rounded-lg shadow-sm border">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">System Configuration</h2>
                    <form action={updateSettings} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">System Instructions</label>
                            <textarea
                                name="systemInstructions"
                                defaultValue={settings.system_instructions}
                                className="w-full h-40 p-3 border rounded-md font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                                placeholder="You are a helpful assistant..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Allowed Channel IDs (comma separated)</label>
                            <input
                                type="text"
                                name="allowedChannelIds"
                                defaultValue={settings.allowed_channels?.join(', ')}
                                className="w-full p-2 border rounded-md font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                                placeholder="123456789, 987654321"
                            />
                        </div>

                        <div className="flex justify-end">
                            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                                Save Changes
                            </button>
                        </div>
                    </form>
                </section>

                {/* Summary Viewer */}
                <section className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-800">Active Conversation Summary</h2>
                        <form action={resetSummary}>
                            <button type="submit" className="text-sm text-red-600 hover:text-red-800 underline">
                                Reset Summary
                            </button>
                        </form>
                    </div>
                    <div className="bg-gray-100 p-4 rounded-md text-sm text-gray-700 whitespace-pre-wrap min-h-[100px] max-h-[300px] overflow-y-auto">
                        {settings.running_summary || <span className="text-gray-400 italic">No summary active.</span>}
                    </div>
                </section>

                {/* PDF Upload */}
                <section className="bg-white p-6 rounded-lg shadow-sm border">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">Add Knowledge (PDF)</h2>
                    <UploadPdfForm />
                </section>
            </div>
        </div>
    )
}

// Client component for file upload to handle state better
import UploadPdfForm from './upload-form'
