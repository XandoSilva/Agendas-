-- Script V2 para criar a tabela de Manutenções no Supabase
-- Execute este script no SQL Editor do seu projeto Supabase
-- ATENÇÃO: Se já criou a tabela v1, você pode apagar com: DROP TABLE public.manutencoes;

CREATE TABLE public.manutencoes (
    id text NOT NULL PRIMARY KEY,
    protocolo text,
    contrato text,
    cliente text,
    contato text,
    endereco text,
    telefones text,
    empreiteira text,
    tipo_reclamacao text,
    obs_despacho text,
    descricao text,
    status text DEFAULT 'Pendente',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Configuração de RLS (Row Level Security) básica permitindo acesso anônimo
ALTER TABLE public.manutencoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable ALL for anon users" ON public.manutencoes
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);
