'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateSettings(formData: FormData) {
    const supabase = createClient()

    const systemInstructions = formData.get('systemInstructions') as string
    const allowedChannelsRaw = formData.get('allowedChannelIds') as string

    // Parse comma-separated IDs into array
    const allowedChannelIds = allowedChannelsRaw
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id.length > 0)

    // Fetch the single row first to get ID
    const { data: settings } = await supabase
        .from('agent_settings')
        .select('id')
        .limit(1)
        .single()

    if (!settings) {
        throw new Error('No agent_settings row found. Please check database.')
    }

    const { error } = await supabase
        .from('agent_settings')
        .update({
            system_instructions: systemInstructions,
            allowed_channels: allowedChannelIds,

        })
        .eq('id', settings.id)

    if (error) {
        throw new Error('Failed to update settings: ' + error.message)
    }

    revalidatePath('/admin')
}

export async function resetSummary() {
    const supabase = createClient()

    // Fetch the single row first to get ID
    const { data: settings } = await supabase
        .from('agent_settings')
        .select('id')
        .limit(1)
        .single()

    if (!settings) {
        throw new Error('No agent_settings row found.')
    }

    const { error } = await supabase
        .from('agent_settings')
        .update({
            running_summary: '',

        })
        .eq('id', settings.id)

    if (error) {
        throw new Error('Failed to reset summary: ' + error.message)
    }

    revalidatePath('/admin')
}
