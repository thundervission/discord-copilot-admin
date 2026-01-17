/**
 * Discord Copilot Bot (Admin-Controlled)
 * AI Provider: Demo Mode (Static Responses)
 */

require('dotenv').config({ path: '.env.local' });

const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');

/* ───────────────────────────────────────────── */
/* Discord Client Setup                           */
/* ───────────────────────────────────────────── */

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel],
});

/* ───────────────────────────────────────────── */
/* Supabase Setup                                 */
/* ───────────────────────────────────────────── */

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* ───────────────────────────────────────────── */
/* Bot Ready                                     */
/* ───────────────────────────────────────────── */

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

/* ───────────────────────────────────────────── */
/* Message Handler                                */
/* ───────────────────────────────────────────── */

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    try {
        /* 1. Fetch Agent Settings */
        const { data: settings, error } = await supabase
            .from('agent_settings')
            .select('*')
            .limit(1)
            .single();

        if (error || !settings) {
            console.error('Failed to load agent settings:', error);
            return;
        }

        /* 2. Allow-list Check */
        const allowedChannels = settings.allowed_channels || [];
        if (!allowedChannels.includes(message.channel.id)) return;

        /* 3. Build Prompt (Unused in Demo Mode but kept for structure) */
        const systemInstructions =
            settings.system_instructions || 'You are a helpful assistant.';
        const summary = settings.running_summary || '';

        // const prompt = ...

        /* 4. Generate Response (Demo Fallback) */
        const reply =
            "🤖 AI inference is disabled in demo mode.\n\n" +
            "This Discord Copilot demonstrates:\n" +
            "- Admin-controlled system instructions\n" +
            "- Channel allow-list enforcement\n" +
            "- Persistent conversation memory\n\n" +
            "The architecture supports pluggable AI providers without changes.";

        if (!reply) return;

        /* 5. Send Reply */
        await message.channel.send(reply);

        /* 6. Update Running Summary */
        // No AI generation for summary. Just append.
        const newSummary = `${summary}\nUser: ${message.content}\nAssistant: ${reply}`;

        await supabase
            .from('agent_settings')
            .update({ running_summary: newSummary })
            .eq('id', settings.id);

    } catch (err) {
        console.error('Error processing message:', err);
    }
});

/* ───────────────────────────────────────────── */
/* Start Bot                                     */
/* ───────────────────────────────────────────── */

client.login(process.env.DISCORD_BOT_TOKEN);
