-- Migration to support Gemini 768-dim embeddings

-- 1. Truncate knowledge_chunks as vectors are incompatible
TRUNCATE TABLE knowledge_chunks;

-- 2. Alter column to 768 dimensions
ALTER TABLE knowledge_chunks 
ALTER COLUMN embedding TYPE vector(768);

-- 3. Update RPC function to accept 768 dimensions
create or replace function match_documents (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id bigint,
  content text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    knowledge_chunks.id,
    knowledge_chunks.content,
    1 - (knowledge_chunks.embedding <=> query_embedding) as similarity
  from knowledge_chunks
  where 1 - (knowledge_chunks.embedding <=> query_embedding) > match_threshold
  order by knowledge_chunks.embedding <=> query_embedding
  limit match_count;
end;
$$;
