-- ============================================================
-- SCRIPT SQL PARA SUPABASE
-- Alba García Santillana - Psicología
-- ============================================================

-- 1. Tabla de servicios
CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  duration INTEGER NOT NULL,
  price REAL NOT NULL,
  deposit_amount REAL NOT NULL,
  is_online BOOLEAN NOT NULL DEFAULT true,
  is_in_person BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tabla de reservas
CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  service_id INTEGER NOT NULL REFERENCES services(id),
  appointment_date DATE NOT NULL,
  appointment_time TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  deposit_paid BOOLEAN NOT NULL DEFAULT false,
  deposit_amount REAL,
  stripe_session_id TEXT,
  calendar_event_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tabla de reseñas
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER REFERENCES bookings(id),
  author_name TEXT NOT NULL,
  rating INTEGER NOT NULL,
  comment TEXT NOT NULL,
  approved BOOLEAN NOT NULL DEFAULT false,
  hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Tabla de tokens de reseña
CREATE TABLE IF NOT EXISTS review_tokens (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER NOT NULL REFERENCES bookings(id),
  token TEXT NOT NULL UNIQUE,
  used BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Tabla de horarios disponibles (extra)
CREATE TABLE IF NOT EXISTS available_slots (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Tabla de horarios bloqueados
CREATE TABLE IF NOT EXISTS blocked_slots (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  time TEXT,  -- NULL = día completo bloqueado
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- DATOS INICIALES: Servicios de Alba García
-- ============================================================

INSERT INTO services (name, description, duration, price, deposit_amount, is_online, is_in_person) VALUES
(
  'Primera Consulta',
  'Sesión de evaluación inicial donde conocemos tu situación, realizamos un Análisis Funcional de tu caso y establecemos los objetivos terapéuticos. Es el primer paso para entender qué te ocurre y diseñar una intervención personalizada. Sin compromiso.',
  60, 50, 15, true, true
),
(
  'Terapia Individual',
  'Sesión de psicoterapia individual con enfoque integrador. Trabajo con Terapia Cognitivo-Conductual (TCC), Terapia de Aceptación y Compromiso (ACT) y técnicas de Análisis Funcional, adaptando la intervención a tus necesidades específicas para ayudarte a superar la ansiedad, el bajo estado de ánimo, problemas de autoestima o gestión emocional.',
  60, 70, 20, true, true
),
(
  'Terapia Dialéctico-Conductual (DBT)',
  'Sesión especializada en Terapia Dialéctico-Conductual para el entrenamiento en regulación emocional, tolerancia al malestar, mindfulness y habilidades interpersonales. Especialmente indicada para la gestión de emociones intensas, la impulsividad y las dificultades en relaciones.',
  60, 70, 20, true, true
),
(
  'Acompañamiento en el Duelo',
  'Acompañamiento terapéutico especializado para el proceso de duelo por pérdida de seres queridos, relaciones o cambios vitales significativos. Combinamos TCC y ACT para ayudarte a transitar el dolor con mayor flexibilidad y encontrar un nuevo equilibrio vital.',
  60, 70, 20, true, true
),
(
  'Evaluación Neuropsicológica',
  'Valoración neuropsicológica completa para evaluar el funcionamiento cognitivo: memoria, atención, funciones ejecutivas, lenguaje y más. Incluye orientación para la rehabilitación o estimulación cognitiva. Indicada para dificultades de memoria, TDAH, daño cerebral adquirido o deterioro cognitivo.',
  90, 120, 30, true, true
);

-- ============================================================
-- ÍNDICES para rendimiento
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(appointment_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_stripe ON bookings(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_review_tokens_token ON review_tokens(token);
CREATE INDEX IF NOT EXISTS idx_review_tokens_booking ON review_tokens(booking_id);
CREATE INDEX IF NOT EXISTS idx_available_slots_date ON available_slots(date);
CREATE INDEX IF NOT EXISTS idx_blocked_slots_date ON blocked_slots(date);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews(approved);

-- ============================================================
-- RLS (Row Level Security) - Desactivado por ahora
-- El backend maneja la autenticación via JWT
-- ============================================================

ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE available_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;

-- Permitir lectura pública de servicios y reseñas aprobadas
CREATE POLICY "Public can view services" ON services FOR SELECT USING (true);
CREATE POLICY "Public can view approved reviews" ON reviews FOR SELECT USING (approved = true AND hidden = false);

-- Permitir todo al service_role (backend con key)
CREATE POLICY "Backend full access services" ON services FOR ALL USING (true);
CREATE POLICY "Backend full access bookings" ON bookings FOR ALL USING (true);
CREATE POLICY "Backend full access reviews" ON reviews FOR ALL USING (true);
CREATE POLICY "Backend full access review_tokens" ON review_tokens FOR ALL USING (true);
CREATE POLICY "Backend full access available_slots" ON available_slots FOR ALL USING (true);
CREATE POLICY "Backend full access blocked_slots" ON blocked_slots FOR ALL USING (true);
