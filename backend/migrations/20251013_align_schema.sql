-- Align existing database schema with current backend expectations.

-- Customers: add optional demographic fields and enforce uniqueness on phone.
ALTER TABLE customers
    ADD COLUMN IF NOT EXISTS birth_place TEXT,
    ADD COLUMN IF NOT EXISTS fiscal_code TEXT,
    ADD COLUMN IF NOT EXISTS address TEXT,
    ADD COLUMN IF NOT EXISTS city TEXT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'customers'::regclass
          AND conname = 'customers_phone_key'
    ) THEN
        ALTER TABLE customers ADD CONSTRAINT customers_phone_key UNIQUE (phone);
    END IF;
END$$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'customers'
          AND column_name = 'phone'
          AND is_nullable = 'YES'
    ) THEN
        IF EXISTS (SELECT 1 FROM customers WHERE phone IS NULL) THEN
            RAISE NOTICE 'customers.phone contains NULL values; please clean them manually before rerunning this script.';
        ELSE
            ALTER TABLE customers ALTER COLUMN phone SET NOT NULL;
        END IF;
    END IF;
END$$;

-- Gift cards: allow drafts without immediate code and align FK.
ALTER TABLE gift_cards ALTER COLUMN code DROP NOT NULL;
ALTER TABLE gift_cards ALTER COLUMN status DROP DEFAULT;
ALTER TABLE gift_cards ADD COLUMN IF NOT EXISTS used_at TIMESTAMPTZ;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'gift_cards'::regclass
          AND conname = 'gift_cards_claimed_by_customer_id_fkey'
    ) THEN
        ALTER TABLE gift_cards DROP CONSTRAINT gift_cards_claimed_by_customer_id_fkey;
    END IF;
END$$;

ALTER TABLE gift_cards
    ADD CONSTRAINT gift_cards_claimed_by_customer_id_fkey
        FOREIGN KEY (claimed_by_customer_id)
        REFERENCES customers(id)
        ON DELETE SET NULL;

-- Consensi: ensure new structure is available while preserving legacy data.
ALTER TABLE consensi
    ADD COLUMN IF NOT EXISTS type TEXT,
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS payload JSONB,
    ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;

UPDATE consensi
SET submitted_at = created_at
WHERE submitted_at IS NULL;

UPDATE consensi
SET type = COALESCE(type, tattoo_piercing_type, 'legacy')
WHERE type IS NULL;

UPDATE consensi
SET payload = COALESCE(payload, to_jsonb(consensi) - 'id')
WHERE payload IS NULL;

DO $$
DECLARE
    col RECORD;
BEGIN
    FOR col IN
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'consensi'
          AND is_nullable = 'NO'
          AND column_name NOT IN ('id','customer_id','gift_card_id','type','phone','payload','submitted_at','created_at','updated_at')
    LOOP
        EXECUTE format('ALTER TABLE consensi ALTER COLUMN %I DROP NOT NULL', col.column_name);
    END LOOP;
END$$;

ALTER TABLE consensi
    ALTER COLUMN type SET NOT NULL,
    ALTER COLUMN payload SET NOT NULL,
    ALTER COLUMN submitted_at SET NOT NULL,
    ALTER COLUMN created_at SET DEFAULT NOW(),
    ALTER COLUMN updated_at SET DEFAULT NOW();

-- Indexes required by the application.
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_gift_cards_status ON gift_cards(status);
CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON gift_cards(code);
CREATE INDEX IF NOT EXISTS idx_gift_cards_claim_token ON gift_cards(claim_token);
CREATE INDEX IF NOT EXISTS idx_appuntamenti_tatuatore ON appuntamenti(tatuatore_id);
CREATE INDEX IF NOT EXISTS idx_appuntamenti_stanza ON appuntamenti(stanza_id);
CREATE INDEX IF NOT EXISTS idx_appuntamenti_orario ON appuntamenti(orario_inizio);
CREATE INDEX IF NOT EXISTS idx_consensi_phone ON consensi(phone);

-- Ensure updated_at trigger exists for all tables.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_customers_updated'
    ) THEN
        CREATE TRIGGER trg_customers_updated
            BEFORE UPDATE ON customers
            FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_gift_cards_updated'
    ) THEN
        CREATE TRIGGER trg_gift_cards_updated
            BEFORE UPDATE ON gift_cards
            FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_tatuatori_updated'
    ) THEN
        CREATE TRIGGER trg_tatuatori_updated
            BEFORE UPDATE ON tatuatori
            FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_stanze_updated'
    ) THEN
        CREATE TRIGGER trg_stanze_updated
            BEFORE UPDATE ON stanze
            FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_appuntamenti_updated'
    ) THEN
        CREATE TRIGGER trg_appuntamenti_updated
            BEFORE UPDATE ON appuntamenti
            FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_consensi_updated'
    ) THEN
        CREATE TRIGGER trg_consensi_updated
            BEFORE UPDATE ON consensi
            FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;
END$$;
