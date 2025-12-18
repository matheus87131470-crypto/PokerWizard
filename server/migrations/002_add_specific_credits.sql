-- Migration: Adicionar colunas específicas de créditos por feature
-- Data: 2025-12-18
-- Descrição: Adiciona usosAnalise, usosTrainer, usosJogadores para rastreamento individual

-- Adicionar colunas (caso não existam)
ALTER TABLE users ADD COLUMN IF NOT EXISTS usos_analise INTEGER DEFAULT 5;
ALTER TABLE users ADD COLUMN IF NOT EXISTS usos_trainer INTEGER DEFAULT 5;
ALTER TABLE users ADD COLUMN IF NOT EXISTS usos_jogadores INTEGER DEFAULT 5;

-- Popular campos para usuários existentes que ainda não têm valores
UPDATE users 
SET usos_analise = 5 
WHERE usos_analise IS NULL OR usos_analise = 0;

UPDATE users 
SET usos_trainer = 5 
WHERE usos_trainer IS NULL OR usos_trainer = 0;

UPDATE users 
SET usos_jogadores = 5 
WHERE usos_jogadores IS NULL OR usos_jogadores = 0;

-- Usuários premium devem ter valores ilimitados (representado por -1 ou valor alto)
UPDATE users 
SET usos_analise = 999999,
    usos_trainer = 999999,
    usos_jogadores = 999999
WHERE premium = true OR status_plano = 'premium';

-- Verificar resultado
SELECT id, email, premium, usos_analise, usos_trainer, usos_jogadores 
FROM users 
LIMIT 10;
