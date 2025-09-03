-- TinkStudio Database Initialization Script
-- This script creates the initial database structure for TinkStudio

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    birth_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create gift_cards table
CREATE TABLE IF NOT EXISTS gift_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status TEXT NOT NULL CHECK (status IN ('draft','active','used','expired')) DEFAULT 'active',
    amount NUMERIC(12,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'EUR',
    expires_at TIMESTAMPTZ,
    notes TEXT,
    claim_token UUID UNIQUE,
    claim_token_expires_at TIMESTAMPTZ,
    claimed_at TIMESTAMPTZ,
    claimed_by_customer_id UUID REFERENCES customers(id),
    code TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    birth_date DATE,
    dedication TEXT,
    consents JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create consensi table
CREATE TABLE IF NOT EXISTS consensi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id),
    gift_card_id UUID REFERENCES gift_cards(id),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    birth_date DATE NOT NULL,
    birth_place TEXT NOT NULL,
    residence TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    document_type TEXT NOT NULL,
    document_number TEXT NOT NULL,
    document_issued_by TEXT NOT NULL,
    document_issued_date DATE NOT NULL,
    tattoo_piercing_type TEXT NOT NULL,
    body_area TEXT NOT NULL,
    allergies TEXT,
    medications TEXT,
    medical_conditions TEXT,
    pregnancy_breastfeeding BOOLEAN DEFAULT FALSE,
    alcohol_drugs BOOLEAN DEFAULT FALSE,
    previous_reactions BOOLEAN DEFAULT FALSE,
    understands_risks BOOLEAN NOT NULL DEFAULT FALSE,
    accepts_responsibility BOOLEAN NOT NULL DEFAULT FALSE,
    authorizes_treatment BOOLEAN NOT NULL DEFAULT FALSE,
    data_processing_consent BOOLEAN NOT NULL DEFAULT FALSE,
    marketing_consent BOOLEAN DEFAULT FALSE,
    signature_data TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON gift_cards(code);
CREATE INDEX IF NOT EXISTS idx_gift_cards_status ON gift_cards(status);
CREATE INDEX IF NOT EXISTS idx_gift_cards_claim_token ON gift_cards(claim_token);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_consensi_customer_id ON consensi(customer_id);
CREATE INDEX IF NOT EXISTS idx_consensi_gift_card_id ON consensi(gift_card_id);
CREATE INDEX IF NOT EXISTS idx_consensi_created_at ON consensi(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gift_cards_updated_at BEFORE UPDATE ON gift_cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consensi_updated_at BEFORE UPDATE ON consensi
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data (optional)
-- INSERT INTO customers (first_name, last_name, email, phone) VALUES
-- ('Mario', 'Rossi', 'mario.rossi@example.com', '+39 123 456 7890'),
-- ('Giulia', 'Bianchi', 'giulia.bianchi@example.com', '+39 098 765 4321');

-- Grant permissions (if needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

COMMIT;