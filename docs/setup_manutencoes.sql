-- Script para criar a tabela de Manutenções no Supabase
-- Execute este script no SQL Editor do seu projeto Supabase

CREATE TABLE public.manutencoes (
    id text NOT NULL PRIMARY KEY,
    equipamento text,
    problema text,
    tecnico text,
    data_relato text,
    status text DEFAULT 'Pendente',
    prioridade text DEFAULT 'Baixa',
    obs text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Configuração de RLS (Row Level Security) básica permitindo acesso anônimo (mesmo padrão atual da tabela agendamentos)
ALTER TABLE public.manutencoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable ALL for anon users" ON public.manutencoes
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);
