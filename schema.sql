-- Enable the vector extension for embeddings
create extension if not exists vector;

-- Table to store system configuration (singleton)
create table agent_settings (
  id bigint primary key generated always as identity,
  system_instructions text not null default 'You are a helpful assistant.',
  allowed_channel_ids text[] not null default '{}',
  active_summary text not null default '',
  openai_api_key text, -- Optional: if you want to store it here, but env var is better. We will stick to env vars as per plan.
  updated_at timestamp with time zone default now()
);

-- Insert the single row if it doesn't exist
insert into agent_settings (id, system_instructions, allowed_channel_ids, active_summary)
select 1, 'You are a helpful assistant.', '{}', ''
where not exists (select 1 from agent_settings where id = 1);

-- Table to store knowledge chunks from PDFs
create table knowledge_chunks (
  id bigint primary key generated always as identity,
  content text not null,
  embedding vector(1536), -- Assumes OpenAI text-embedding-3-small or ada-002
  created_at timestamp with time zone default now()
);

-- Index for faster vector similarity search
create index on knowledge_chunks using hnsw (embedding vector_l2_ops);

-- RLS Policies (Simplified for this single-user logic, but good practice)
alter table agent_settings enable row level security;
alter table knowledge_chunks enable row level security;

-- Allow read/write for authenticated users (the admin dashboard)
create policy "Enable all access for authenticated users" on agent_settings
  for all to authenticated using (true) with check (true);

create policy "Enable all access for authenticated users" on knowledge_chunks
  for all to authenticated using (true) with check (true);

-- Allow read access for the bot (using service role, which bypasses RLS, but if we used anon/custom role)
-- Service role bypasses RLS, so no extra policy needed for the bot script if it uses service role key.
