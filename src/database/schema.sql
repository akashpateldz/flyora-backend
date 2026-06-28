-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║                                                                              ║
-- ║   FlyoraGo — Premium Luggage Sharing Marketplace                             ║
-- ║   Production-Ready PostgreSQL Database Schema                                ║
-- ║                                                                              ║
-- ║   Database : flyorago                                                        ║
-- ║   Version  : 1.0.0                                                           ║
-- ║   Created  : 2026-06-23                                                      ║
-- ║                                                                              ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- ════════════════════════════════════════════════════════════════════════════════
-- 0. EXTENSIONS
-- ════════════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- provides gen_random_uuid()

-- ════════════════════════════════════════════════════════════════════════════════
-- 1. ENUM TYPES
-- ════════════════════════════════════════════════════════════════════════════════

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('traveler', 'sender', 'both');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'kyc_status') THEN
        CREATE TYPE kyc_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'NOT_SUBMITTED');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_type') THEN
        CREATE TYPE document_type AS ENUM ('passport', 'national_id', 'drivers_license');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trip_status') THEN
        CREATE TYPE trip_status AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'shipment_category') THEN
        CREATE TYPE shipment_category AS ENUM ('documents', 'electronics', 'clothing', 'food', 'other');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'shipment_status') THEN
        CREATE TYPE shipment_status AS ENUM ('PENDING', 'MATCHED', 'DELIVERED', 'CANCELLED');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
        CREATE TYPE booking_status AS ENUM ('REQUESTED', 'ACCEPTED', 'PAID', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'kyc_review_status') THEN
        CREATE TYPE kyc_review_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
    END IF;
END $$;

-- ════════════════════════════════════════════════════════════════════════════════
-- 2. REUSABLE TRIGGER FUNCTION — auto-update `updated_at`
-- ════════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_set_updated_at()
    IS 'Automatically sets updated_at to current timestamp on every row UPDATE.';

-- ════════════════════════════════════════════════════════════════════════════════
-- 3. TABLES
-- ════════════════════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────────────────
-- 3.1  USERS
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
    id                UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name         VARCHAR(150)    NOT NULL,
    email             VARCHAR(255)    NOT NULL,
    phone             VARCHAR(20),
    password_hash     TEXT            NOT NULL,
    role              user_role       NOT NULL DEFAULT 'sender',
    kyc_status        kyc_status      NOT NULL DEFAULT 'NOT_SUBMITTED',
    profile_image_url TEXT,
    email_verified    BOOLEAN         NOT NULL DEFAULT FALSE,
    phone_verified    BOOLEAN         NOT NULL DEFAULT FALSE,
    average_rating    NUMERIC(2,1)    NOT NULL DEFAULT 0.0,
    total_reviews     INTEGER         NOT NULL DEFAULT 0,
    is_active         BOOLEAN         NOT NULL DEFAULT TRUE,
    last_login_at     TIMESTAMPTZ,
    created_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT uq_users_email       UNIQUE (email),
    CONSTRAINT chk_users_rating     CHECK  (average_rating >= 0.0 AND average_rating <= 5.0),
    CONSTRAINT chk_users_reviews    CHECK  (total_reviews >= 0)
);

COMMENT ON TABLE  users                    IS 'All platform users — Travelers, Senders, or Both.';
COMMENT ON COLUMN users.id                 IS 'Unique user identifier (UUID v4).';
COMMENT ON COLUMN users.full_name          IS 'User display name.';
COMMENT ON COLUMN users.email              IS 'Unique email address used for login.';
COMMENT ON COLUMN users.phone              IS 'Contact phone number with country code.';
COMMENT ON COLUMN users.password_hash      IS 'Bcrypt / Argon2 hashed password. Never store plaintext.';
COMMENT ON COLUMN users.role               IS 'Platform role: traveler | sender | both.';
COMMENT ON COLUMN users.kyc_status         IS 'Identity verification state.';
COMMENT ON COLUMN users.profile_image_url  IS 'URL to profile picture (cloud storage).';
COMMENT ON COLUMN users.email_verified     IS 'Whether email has been confirmed via OTP / link.';
COMMENT ON COLUMN users.phone_verified     IS 'Whether phone has been confirmed via OTP.';
COMMENT ON COLUMN users.average_rating     IS 'Cached average rating (1.0–5.0), updated by trigger or app logic.';
COMMENT ON COLUMN users.total_reviews      IS 'Cached total review count.';
COMMENT ON COLUMN users.is_active          IS 'Soft-delete / suspension flag.';
COMMENT ON COLUMN users.last_login_at      IS 'Timestamp of most recent login.';
COMMENT ON COLUMN users.created_at         IS 'Row creation timestamp.';
COMMENT ON COLUMN users.updated_at         IS 'Row last-modified timestamp (auto-updated by trigger).';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email      ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role       ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_kyc_status ON users (kyc_status);

-- Trigger
CREATE OR REPLACE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION fn_set_updated_at();

-- ──────────────────────────────────────────────────────────────────────────────
-- 3.2  WAITLIST
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS waitlist (
    id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(255)    NOT NULL,
    name        VARCHAR(150),
    role        user_role,
    ip_address  INET,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT uq_waitlist_email UNIQUE (email)
);

COMMENT ON TABLE  waitlist              IS 'Early-access registrations collected before platform launch.';
COMMENT ON COLUMN waitlist.id           IS 'Unique waitlist entry identifier.';
COMMENT ON COLUMN waitlist.email        IS 'Registrant email (unique).';
COMMENT ON COLUMN waitlist.name         IS 'Optional registrant name.';
COMMENT ON COLUMN waitlist.role         IS 'Intended platform role.';
COMMENT ON COLUMN waitlist.ip_address   IS 'IP address at time of registration (fraud detection).';
COMMENT ON COLUMN waitlist.created_at   IS 'Registration timestamp.';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_waitlist_email      ON waitlist (email);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist (created_at);

-- ──────────────────────────────────────────────────────────────────────────────
-- 3.3  KYC_SUBMISSIONS
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS kyc_submissions (
    id                UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID              NOT NULL,
    document_type     document_type     NOT NULL,
    front_image_url   TEXT              NOT NULL,
    back_image_url    TEXT,
    selfie_image_url  TEXT              NOT NULL,
    status            kyc_review_status NOT NULL DEFAULT 'PENDING',
    rejection_reason  TEXT,
    submitted_at      TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
    reviewed_at       TIMESTAMPTZ,
    created_at        TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ       NOT NULL DEFAULT NOW(),

    -- Foreign Keys
    CONSTRAINT fk_kyc_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
);

COMMENT ON TABLE  kyc_submissions                    IS 'Identity verification document submissions.';
COMMENT ON COLUMN kyc_submissions.id                 IS 'Unique KYC submission identifier.';
COMMENT ON COLUMN kyc_submissions.user_id            IS 'References the user who submitted the KYC.';
COMMENT ON COLUMN kyc_submissions.document_type      IS 'Type of ID document: passport | national_id | drivers_license.';
COMMENT ON COLUMN kyc_submissions.front_image_url    IS 'URL to front side of the ID document.';
COMMENT ON COLUMN kyc_submissions.back_image_url     IS 'URL to back side of the ID document (optional for passports).';
COMMENT ON COLUMN kyc_submissions.selfie_image_url   IS 'URL to selfie holding the document for liveness check.';
COMMENT ON COLUMN kyc_submissions.status             IS 'Review status: PENDING | APPROVED | REJECTED.';
COMMENT ON COLUMN kyc_submissions.rejection_reason   IS 'Explanation when status is REJECTED.';
COMMENT ON COLUMN kyc_submissions.submitted_at       IS 'When the user submitted the documents.';
COMMENT ON COLUMN kyc_submissions.reviewed_at        IS 'When an admin reviewed the submission.';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_kyc_user_id ON kyc_submissions (user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_status  ON kyc_submissions (status);

-- Trigger
CREATE OR REPLACE TRIGGER trg_kyc_updated_at
    BEFORE UPDATE ON kyc_submissions
    FOR EACH ROW
    EXECUTE FUNCTION fn_set_updated_at();

-- ──────────────────────────────────────────────────────────────────────────────
-- 3.4  TRIPS
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS trips (
    id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID          NOT NULL,
    from_city         VARCHAR(120)  NOT NULL,
    from_city_code    VARCHAR(10),
    to_city           VARCHAR(120)  NOT NULL,
    to_city_code      VARCHAR(10),
    travel_date       DATE          NOT NULL,
    available_weight  NUMERIC(6,2)  NOT NULL,
    price_per_kg      NUMERIC(10,2) NOT NULL,
    status            trip_status   NOT NULL DEFAULT 'ACTIVE',
    notes             TEXT,
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    -- Foreign Keys
    CONSTRAINT fk_trips_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE,

    -- Validation
    CONSTRAINT chk_trips_weight CHECK (available_weight > 0),
    CONSTRAINT chk_trips_price  CHECK (price_per_kg >= 0)
);

COMMENT ON TABLE  trips                      IS 'Traveler trip listings — available luggage capacity for sharing.';
COMMENT ON COLUMN trips.id                   IS 'Unique trip identifier.';
COMMENT ON COLUMN trips.user_id              IS 'The traveler who created this trip.';
COMMENT ON COLUMN trips.from_city            IS 'Departure city name.';
COMMENT ON COLUMN trips.from_city_code       IS 'IATA or internal city code (e.g. BOM, DEL).';
COMMENT ON COLUMN trips.to_city              IS 'Arrival city name.';
COMMENT ON COLUMN trips.to_city_code         IS 'IATA or internal city code for destination.';
COMMENT ON COLUMN trips.travel_date          IS 'Date of travel.';
COMMENT ON COLUMN trips.available_weight     IS 'Remaining weight capacity in kilograms.';
COMMENT ON COLUMN trips.price_per_kg         IS 'Price the traveler charges per kilogram.';
COMMENT ON COLUMN trips.status               IS 'Trip lifecycle status: ACTIVE | COMPLETED | CANCELLED.';
COMMENT ON COLUMN trips.notes                IS 'Optional notes or restrictions set by the traveler.';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_trips_user_id     ON trips (user_id);
CREATE INDEX IF NOT EXISTS idx_trips_travel_date ON trips (travel_date);
CREATE INDEX IF NOT EXISTS idx_trips_from_city   ON trips (from_city);
CREATE INDEX IF NOT EXISTS idx_trips_to_city     ON trips (to_city);
CREATE INDEX IF NOT EXISTS idx_trips_status      ON trips (status);

-- Trigger
CREATE OR REPLACE TRIGGER trg_trips_updated_at
    BEFORE UPDATE ON trips
    FOR EACH ROW
    EXECUTE FUNCTION fn_set_updated_at();

-- ──────────────────────────────────────────────────────────────────────────────
-- 3.5  SHIPMENTS
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS shipments (
    id                  UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID              NOT NULL,
    title               VARCHAR(255)      NOT NULL,
    from_city           VARCHAR(120)      NOT NULL,
    to_city             VARCHAR(120)      NOT NULL,
    delivery_deadline   DATE              NOT NULL,
    weight              NUMERIC(6,2)      NOT NULL,
    price_paid          NUMERIC(12,2)     NOT NULL DEFAULT 0,
    category            shipment_category NOT NULL DEFAULT 'other',
    description         TEXT,
    status              shipment_status   NOT NULL DEFAULT 'PENDING',
    created_at          TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ       NOT NULL DEFAULT NOW(),

    -- Foreign Keys
    CONSTRAINT fk_shipments_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE,

    -- Validation
    CONSTRAINT chk_shipments_weight     CHECK (weight > 0),
    CONSTRAINT chk_shipments_price_paid CHECK (price_paid >= 0)
);

COMMENT ON TABLE  shipments                       IS 'Parcel listings created by senders looking for travelers to carry their items.';
COMMENT ON COLUMN shipments.id                    IS 'Unique shipment identifier.';
COMMENT ON COLUMN shipments.user_id               IS 'The sender who created this shipment request.';
COMMENT ON COLUMN shipments.title                 IS 'Short title describing the parcel.';
COMMENT ON COLUMN shipments.from_city             IS 'Pickup city.';
COMMENT ON COLUMN shipments.to_city               IS 'Destination city.';
COMMENT ON COLUMN shipments.delivery_deadline     IS 'Latest acceptable delivery date.';
COMMENT ON COLUMN shipments.weight                IS 'Parcel weight in kilograms.';
COMMENT ON COLUMN shipments.price_paid            IS 'Amount the sender is willing to pay (or has paid).';
COMMENT ON COLUMN shipments.category              IS 'Parcel category: documents | electronics | clothing | food | other.';
COMMENT ON COLUMN shipments.description           IS 'Detailed description of the parcel contents.';
COMMENT ON COLUMN shipments.status                IS 'Shipment lifecycle: PENDING | MATCHED | DELIVERED | CANCELLED.';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shipments_user_id           ON shipments (user_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status            ON shipments (status);
CREATE INDEX IF NOT EXISTS idx_shipments_category          ON shipments (category);
CREATE INDEX IF NOT EXISTS idx_shipments_delivery_deadline ON shipments (delivery_deadline);
CREATE INDEX IF NOT EXISTS idx_shipments_from_city         ON shipments (from_city);
CREATE INDEX IF NOT EXISTS idx_shipments_to_city           ON shipments (to_city);

-- Trigger
CREATE OR REPLACE TRIGGER trg_shipments_updated_at
    BEFORE UPDATE ON shipments
    FOR EACH ROW
    EXECUTE FUNCTION fn_set_updated_at();

-- ──────────────────────────────────────────────────────────────────────────────
-- 3.6  BOOKINGS
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bookings (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id         UUID            NOT NULL,
    shipment_id     UUID            NOT NULL,
    matched_weight  NUMERIC(6,2)    NOT NULL,
    total_amount    NUMERIC(12,2)   NOT NULL,
    status          booking_status  NOT NULL DEFAULT 'REQUESTED',
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    -- Foreign Keys
    CONSTRAINT fk_bookings_trip FOREIGN KEY (trip_id)
        REFERENCES trips (id) ON DELETE CASCADE,
    CONSTRAINT fk_bookings_shipment FOREIGN KEY (shipment_id)
        REFERENCES shipments (id) ON DELETE CASCADE,

    -- A trip–shipment pair can only be matched once
    CONSTRAINT uq_bookings_trip_shipment UNIQUE (trip_id, shipment_id),

    -- Validation
    CONSTRAINT chk_bookings_weight CHECK (matched_weight > 0),
    CONSTRAINT chk_bookings_amount CHECK (total_amount >= 0)
);

COMMENT ON TABLE  bookings                    IS 'Matches between a traveler trip and a sender shipment.';
COMMENT ON COLUMN bookings.id                 IS 'Unique booking identifier.';
COMMENT ON COLUMN bookings.trip_id            IS 'The trip carrying the shipment.';
COMMENT ON COLUMN bookings.shipment_id        IS 'The shipment being carried.';
COMMENT ON COLUMN bookings.matched_weight     IS 'Weight allocated from the trip to this shipment (kg).';
COMMENT ON COLUMN bookings.total_amount       IS 'Total transaction amount for this booking.';
COMMENT ON COLUMN bookings.status             IS 'Booking lifecycle: REQUESTED → ACCEPTED → PAID → IN_TRANSIT → DELIVERED | CANCELLED.';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bookings_trip_id     ON bookings (trip_id);
CREATE INDEX IF NOT EXISTS idx_bookings_shipment_id ON bookings (shipment_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status      ON bookings (status);

-- Trigger
CREATE OR REPLACE TRIGGER trg_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION fn_set_updated_at();

-- ──────────────────────────────────────────────────────────────────────────────
-- 3.7  REVIEWS
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS reviews (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id    UUID        NOT NULL,
    reviewer_id   UUID        NOT NULL,
    reviewee_id   UUID        NOT NULL,
    rating        INTEGER     NOT NULL,
    comment       TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Foreign Keys
    CONSTRAINT fk_reviews_booking  FOREIGN KEY (booking_id)
        REFERENCES bookings (id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_reviewer FOREIGN KEY (reviewer_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_reviewee FOREIGN KEY (reviewee_id)
        REFERENCES users (id) ON DELETE CASCADE,

    -- A user can review only once per booking
    CONSTRAINT uq_reviews_booking_reviewer UNIQUE (booking_id, reviewer_id),

    -- Validation
    CONSTRAINT chk_reviews_rating    CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT chk_reviews_self      CHECK (reviewer_id <> reviewee_id)
);

COMMENT ON TABLE  reviews                  IS 'Post-delivery ratings and reviews between traveler and sender.';
COMMENT ON COLUMN reviews.id               IS 'Unique review identifier.';
COMMENT ON COLUMN reviews.booking_id       IS 'The booking this review relates to.';
COMMENT ON COLUMN reviews.reviewer_id      IS 'User who wrote the review.';
COMMENT ON COLUMN reviews.reviewee_id      IS 'User who received the review.';
COMMENT ON COLUMN reviews.rating           IS 'Star rating from 1 (worst) to 5 (best).';
COMMENT ON COLUMN reviews.comment          IS 'Optional text review.';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id  ON reviews (booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews (reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON reviews (reviewee_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- 3.8  MESSAGES
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS messages (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id    UUID        NOT NULL,
    sender_id     UUID        NOT NULL,
    receiver_id   UUID        NOT NULL,
    message_text  TEXT        NOT NULL,
    is_read       BOOLEAN     NOT NULL DEFAULT FALSE,
    sent_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Foreign Keys
    CONSTRAINT fk_messages_booking  FOREIGN KEY (booking_id)
        REFERENCES bookings (id) ON DELETE CASCADE,
    CONSTRAINT fk_messages_sender   FOREIGN KEY (sender_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_messages_receiver FOREIGN KEY (receiver_id)
        REFERENCES users (id) ON DELETE CASCADE
);

COMMENT ON TABLE  messages                   IS 'In-app chat messages between traveler and sender within a booking.';
COMMENT ON COLUMN messages.id                IS 'Unique message identifier.';
COMMENT ON COLUMN messages.booking_id        IS 'The booking conversation this message belongs to.';
COMMENT ON COLUMN messages.sender_id         IS 'User who sent the message.';
COMMENT ON COLUMN messages.receiver_id       IS 'User who should receive the message.';
COMMENT ON COLUMN messages.message_text      IS 'Message body text.';
COMMENT ON COLUMN messages.is_read           IS 'Whether the receiver has read this message.';
COMMENT ON COLUMN messages.sent_at           IS 'Timestamp when the message was sent.';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_messages_booking_id  ON messages (booking_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id   ON messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages (receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at     ON messages (sent_at);


-- ════════════════════════════════════════════════════════════════════════════════
-- 4. SAMPLE SEED DATA
-- ════════════════════════════════════════════════════════════════════════════════

-- We use fixed UUIDs so foreign-key references are deterministic.

-- 4.1  Users (password_hash = bcrypt of "Test@1234")
INSERT INTO users (id, full_name, email, phone, password_hash, role, kyc_status, email_verified, average_rating)
VALUES
    (
        'a1b2c3d4-e5f6-7890-abcd-ef1234567801',
        'Arjun Patel',
        'arjun.patel@flyorago.com',
        '+919876543210',
        '$2b$12$LJ3m5ZJpHmXfVnYPm1xkCeVz5Nz9kRxkRQVdU2YwF5vR0a3G7dH5q',
        'traveler',
        'APPROVED',
        TRUE,
        4.8
    ),
    (
        'a1b2c3d4-e5f6-7890-abcd-ef1234567802',
        'Priya Sharma',
        'priya.sharma@flyorago.com',
        '+918765432109',
        '$2b$12$LJ3m5ZJpHmXfVnYPm1xkCeVz5Nz9kRxkRQVdU2YwF5vR0a3G7dH5q',
        'sender',
        'APPROVED',
        TRUE,
        4.5
    )
ON CONFLICT (email) DO NOTHING;

-- 4.2  Waitlist
INSERT INTO waitlist (email, name, role)
VALUES
    ('early.user1@gmail.com', 'Early Adopter', 'both'),
    ('early.user2@gmail.com', 'Beta Tester',   'traveler')
ON CONFLICT (email) DO NOTHING;

-- 4.3  Trip (by Arjun)
INSERT INTO trips (id, user_id, from_city, from_city_code, to_city, to_city_code, travel_date, available_weight, price_per_kg, notes)
VALUES
    (
        'b2c3d4e5-f6a7-8901-bcde-f12345678901',
        'a1b2c3d4-e5f6-7890-abcd-ef1234567801',
        'Mumbai',   'BOM',
        'New York', 'JFK',
        '2026-07-15',
        10.00,
        8.50,
        'Direct flight. Can carry electronics and documents.'
    )
ON CONFLICT DO NOTHING;

-- 4.4  Shipment (by Priya)
INSERT INTO shipments (id, user_id, title, from_city, to_city, delivery_deadline, weight, price_paid, category, description)
VALUES
    (
        'c3d4e5f6-a7b8-9012-cdef-123456789012',
        'a1b2c3d4-e5f6-7890-abcd-ef1234567802',
        'Birthday Gift for Brother',
        'Mumbai',
        'New York',
        '2026-07-20',
        2.50,
        21.25,
        'other',
        'Wrapped gift box — traditional Indian sweets and a wristwatch.'
    )
ON CONFLICT DO NOTHING;

-- 4.5  Booking (matches the above trip ↔ shipment)
INSERT INTO bookings (id, trip_id, shipment_id, matched_weight, total_amount, status)
VALUES
    (
        'd4e5f6a7-b8c9-0123-defa-234567890123',
        'b2c3d4e5-f6a7-8901-bcde-f12345678901',
        'c3d4e5f6-a7b8-9012-cdef-123456789012',
        2.50,
        21.25,
        'PAID'
    )
ON CONFLICT DO NOTHING;

-- 4.6  Review (Priya reviews Arjun after delivery)
INSERT INTO reviews (booking_id, reviewer_id, reviewee_id, rating, comment)
VALUES
    (
        'd4e5f6a7-b8c9-0123-defa-234567890123',
        'a1b2c3d4-e5f6-7890-abcd-ef1234567802',   -- Priya (reviewer)
        'a1b2c3d4-e5f6-7890-abcd-ef1234567801',   -- Arjun (reviewee)
        5,
        'Arjun delivered the package on time and in perfect condition. Highly recommended!'
    )
ON CONFLICT DO NOTHING;

-- 4.7  Messages (chat within the booking)
INSERT INTO messages (booking_id, sender_id, receiver_id, message_text, is_read)
VALUES
    (
        'd4e5f6a7-b8c9-0123-defa-234567890123',
        'a1b2c3d4-e5f6-7890-abcd-ef1234567802',   -- Priya
        'a1b2c3d4-e5f6-7890-abcd-ef1234567801',   -- Arjun
        'Hi Arjun! Can you pick up the package from Andheri West on July 13?',
        TRUE
    ),
    (
        'd4e5f6a7-b8c9-0123-defa-234567890123',
        'a1b2c3d4-e5f6-7890-abcd-ef1234567801',   -- Arjun
        'a1b2c3d4-e5f6-7890-abcd-ef1234567802',   -- Priya
        'Sure Priya! I will be in Andheri on the 13th afternoon. Will collect it then.',
        TRUE
    )
ON CONFLICT DO NOTHING;


-- ════════════════════════════════════════════════════════════════════════════════
-- 5. VERIFICATION QUERIES
-- ════════════════════════════════════════════════════════════════════════════════

-- 5.1  Row counts per table
SELECT 'users'           AS table_name, COUNT(*) AS row_count FROM users
UNION ALL
SELECT 'waitlist',        COUNT(*) FROM waitlist
UNION ALL
SELECT 'kyc_submissions', COUNT(*) FROM kyc_submissions
UNION ALL
SELECT 'trips',           COUNT(*) FROM trips
UNION ALL
SELECT 'shipments',       COUNT(*) FROM shipments
UNION ALL
SELECT 'bookings',        COUNT(*) FROM bookings
UNION ALL
SELECT 'reviews',         COUNT(*) FROM reviews
UNION ALL
SELECT 'messages',        COUNT(*) FROM messages
ORDER BY table_name;

-- 5.2  Join: Booking details with traveler, sender, trip, and shipment info
SELECT
    b.id              AS booking_id,
    b.status          AS booking_status,
    b.matched_weight,
    b.total_amount,
    t.from_city       AS trip_from,
    t.to_city         AS trip_to,
    t.travel_date,
    traveler.full_name AS traveler_name,
    s.title           AS shipment_title,
    s.weight          AS shipment_weight,
    sender.full_name  AS sender_name
FROM bookings b
JOIN trips     t        ON b.trip_id     = t.id
JOIN shipments s        ON b.shipment_id = s.id
JOIN users     traveler ON t.user_id     = traveler.id
JOIN users     sender   ON s.user_id     = sender.id;

-- 5.3  Join: Reviews with reviewer and reviewee names
SELECT
    r.rating,
    r.comment,
    reviewer.full_name AS reviewed_by,
    reviewee.full_name AS reviewed_for,
    r.created_at
FROM reviews r
JOIN users reviewer ON r.reviewer_id = reviewer.id
JOIN users reviewee ON r.reviewee_id = reviewee.id;

-- 5.4  Join: Messages in a booking with sender/receiver names
SELECT
    m.message_text,
    m.is_read,
    m.sent_at,
    sender.full_name   AS from_user,
    receiver.full_name AS to_user
FROM messages m
JOIN users sender   ON m.sender_id   = sender.id
JOIN users receiver ON m.receiver_id = receiver.id
ORDER BY m.sent_at;

-- ════════════════════════════════════════════════════════════════════════════════
-- ✅  Schema creation complete — FlyoraGo is ready for takeoff!
-- ════════════════════════════════════════════════════════════════════════════════
