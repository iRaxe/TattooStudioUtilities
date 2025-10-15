-- TinkStudio Database Initialization Script
-- Aligns the PostgreSQL schema with backend/db.js

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT UNIQUE NOT NULL,
    birth_date DATE,
    birth_place TEXT,
    fiscal_code TEXT,
    address TEXT,
    city TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Gift cards table
CREATE TABLE IF NOT EXISTS gift_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status TEXT NOT NULL CHECK (status IN ('draft','active','used','expired')),
    amount NUMERIC(12,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'EUR',
    expires_at TIMESTAMPTZ,
    notes TEXT,
    claim_token UUID UNIQUE,
    claim_token_expires_at TIMESTAMPTZ,
    claimed_at TIMESTAMPTZ,
    claimed_by_customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    code TEXT UNIQUE,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    birth_date DATE,
    dedication TEXT,
    consents JSONB,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tatuatori table
CREATE TABLE IF NOT EXISTS tatuatori (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    attivo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Stanze table
CREATE TABLE IF NOT EXISTS stanze (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    no_overbooking BOOLEAN NOT NULL DEFAULT FALSE,
    attivo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Appuntamenti table
CREATE TABLE IF NOT EXISTS appuntamenti (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tatuatore_id UUID NOT NULL REFERENCES tatuatori(id) ON DELETE CASCADE,
    stanza_id UUID NOT NULL REFERENCES stanze(id) ON DELETE CASCADE,
    cliente_telefono TEXT,
    cliente_nome TEXT,
    orario_inizio TIMESTAMPTZ NOT NULL,
    durata_minuti INTEGER NOT NULL DEFAULT 60,
    note TEXT,
    stato TEXT NOT NULL DEFAULT 'confermato' CHECK (stato IN ('confermato','cancellato','completato')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Consensi table
CREATE TABLE IF NOT EXISTS consensi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    gift_card_id UUID REFERENCES gift_cards(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    phone TEXT,
    payload JSONB NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_gift_cards_status ON gift_cards(status);
CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON gift_cards(code);
CREATE INDEX IF NOT EXISTS idx_gift_cards_claim_token ON gift_cards(claim_token);
CREATE INDEX IF NOT EXISTS idx_appuntamenti_tatuatore ON appuntamenti(tatuatore_id);
CREATE INDEX IF NOT EXISTS idx_appuntamenti_stanza ON appuntamenti(stanza_id);
CREATE INDEX IF NOT EXISTS idx_appuntamenti_orario ON appuntamenti(orario_inizio);
CREATE INDEX IF NOT EXISTS idx_consensi_phone ON consensi(phone);

-- updated_at trigger helper
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_customers_updated
    BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_gift_cards_updated
    BEFORE UPDATE ON gift_cards
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_tatuatori_updated
    BEFORE UPDATE ON tatuatori
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_stanze_updated
    BEFORE UPDATE ON stanze
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_appuntamenti_updated
    BEFORE UPDATE ON appuntamenti
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_consensi_updated
    BEFORE UPDATE ON consensi
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
