-- ================================================================
-- INNOVA MGA — Supabase Database Schema
-- Gestora Maben S.A.S.
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ================================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- TABLA: perfiles
-- Información adicional de cada usuario registrado
-- ================================================================
CREATE TABLE IF NOT EXISTS public.perfiles (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  nombre_completo TEXT,
  cargo           TEXT,
  entidad         TEXT,
  telefono        TEXT,
  avatar_url      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS para perfiles
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven su propio perfil"
  ON public.perfiles FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios editan su propio perfil"
  ON public.perfiles FOR UPDATE
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios insertan su propio perfil"
  ON public.perfiles FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

-- Trigger: crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.perfiles (usuario_id, nombre_completo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre_completo', NEW.email)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================================================================
-- TABLA: proyectos
-- Registro principal de proyectos de inversión pública
-- ================================================================
CREATE TYPE public.estado_proyecto AS ENUM (
  'borrador', 'formulacion', 'revision', 'subsanacion', 'listo'
);

CREATE TABLE IF NOT EXISTS public.proyectos (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at            TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at            TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  usuario_id            UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Identificación
  nombre                TEXT NOT NULL,
  bpin                  TEXT,
  estado                public.estado_proyecto DEFAULT 'borrador' NOT NULL,
  sector                TEXT,
  programa              TEXT,
  vigencia              INTEGER DEFAULT EXTRACT(YEAR FROM NOW())::INTEGER,

  -- Localización
  departamento          TEXT,
  municipio             TEXT,
  codigo_municipio      TEXT,
  localizacion_detalle  TEXT,
  latitud               NUMERIC(10, 7),
  longitud              NUMERIC(10, 7),

  -- Entidad ejecutora
  entidad_ejecutora     TEXT,
  nit_ejecutora         TEXT,
  representante_legal   TEXT,

  -- Financiero
  presupuesto_total     NUMERIC(18, 2) DEFAULT 0 NOT NULL,

  -- Descripción
  objetivo              TEXT,
  descripcion           TEXT,
  poblacion_beneficiada INTEGER DEFAULT 0,

  -- Producto MGA
  codigo_producto       TEXT,
  nombre_producto       TEXT,
  unidad_medida         TEXT,
  meta_producto         NUMERIC DEFAULT 0,
  codigo_indicador      TEXT,
  nombre_indicador      TEXT,

  -- Avance de formulación (0-100)
  avance                INTEGER DEFAULT 0 CHECK (avance >= 0 AND avance <= 100)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_proyectos_usuario ON public.proyectos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_proyectos_estado  ON public.proyectos(estado);
CREATE INDEX IF NOT EXISTS idx_proyectos_sector  ON public.proyectos(sector);

-- Trigger: actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER proyectos_updated_at
  BEFORE UPDATE ON public.proyectos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS para proyectos
ALTER TABLE public.proyectos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven sus proyectos"
  ON public.proyectos FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios crean proyectos"
  ON public.proyectos FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuarios editan sus proyectos"
  ON public.proyectos FOR UPDATE
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios eliminan sus proyectos"
  ON public.proyectos FOR DELETE
  USING (auth.uid() = usuario_id);

-- ================================================================
-- TABLA: lineamientos_estado
-- Almacena el estado y datos de cada módulo por proyecto
-- Usa JSONB para flexibilidad máxima en el almacenamiento
-- ================================================================
CREATE TYPE public.estado_lineamiento AS ENUM (
  'pendiente', 'parcial', 'completado'
);

CREATE TABLE IF NOT EXISTS public.lineamientos_estado (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  proyecto_id UUID REFERENCES public.proyectos(id) ON DELETE CASCADE NOT NULL,
  modulo      TEXT NOT NULL, -- 'enfoque' | 'localizacion' | 'disenos' | ...
  estado      public.estado_lineamiento DEFAULT 'pendiente' NOT NULL,
  datos       JSONB DEFAULT '{}'::JSONB NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(proyecto_id, modulo)
);

CREATE INDEX IF NOT EXISTS idx_lineamientos_proyecto ON public.lineamientos_estado(proyecto_id);

CREATE TRIGGER lineamientos_updated_at
  BEFORE UPDATE ON public.lineamientos_estado
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS para lineamientos
ALTER TABLE public.lineamientos_estado ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven lineamientos de sus proyectos"
  ON public.lineamientos_estado FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.proyectos
      WHERE id = lineamientos_estado.proyecto_id
      AND usuario_id = auth.uid()
    )
  );

CREATE POLICY "Usuarios crean lineamientos de sus proyectos"
  ON public.lineamientos_estado FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.proyectos
      WHERE id = proyecto_id AND usuario_id = auth.uid()
    )
  );

CREATE POLICY "Usuarios editan lineamientos de sus proyectos"
  ON public.lineamientos_estado FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.proyectos
      WHERE id = lineamientos_estado.proyecto_id
      AND usuario_id = auth.uid()
    )
  );

-- ================================================================
-- TABLA: archivos
-- Metadatos de archivos subidos a Supabase Storage
-- ================================================================
CREATE TABLE IF NOT EXISTS public.archivos (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  proyecto_id  UUID REFERENCES public.proyectos(id) ON DELETE CASCADE NOT NULL,
  modulo       TEXT,
  nombre       TEXT NOT NULL,
  tipo         TEXT,
  storage_path TEXT NOT NULL,
  size         INTEGER,
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_archivos_proyecto ON public.archivos(proyecto_id);

ALTER TABLE public.archivos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven archivos de sus proyectos"
  ON public.archivos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.proyectos
      WHERE id = archivos.proyecto_id AND usuario_id = auth.uid()
    )
  );

CREATE POLICY "Usuarios suben archivos a sus proyectos"
  ON public.archivos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.proyectos
      WHERE id = proyecto_id AND usuario_id = auth.uid()
    )
  );

CREATE POLICY "Usuarios eliminan archivos de sus proyectos"
  ON public.archivos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.proyectos
      WHERE id = archivos.proyecto_id AND usuario_id = auth.uid()
    )
  );

-- ================================================================
-- STORAGE: Crear bucket para archivos de proyectos
-- (ejecutar aparte o desde el dashboard)
-- ================================================================
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('proyectos-archivos', 'proyectos-archivos', false);

-- Storage policies (habilitar en el dashboard de Supabase):
-- Autenticados pueden subir a su carpeta: auth.uid()::text = (storage.foldername(name))[1]

-- ================================================================
-- FUNCIÓN: calcular_avance_proyecto
-- Calcula el % de avance basado en los módulos completados
-- ================================================================
CREATE OR REPLACE FUNCTION public.calcular_avance(p_proyecto_id UUID)
RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE
  total_modulos INTEGER := 9; -- enfoque, localizacion, disenos, presupuesto, pdn, documentos, normativas, viabilidad, sostenibilidad
  completados   INTEGER;
  parciales     INTEGER;
BEGIN
  SELECT
    COUNT(*) FILTER (WHERE estado = 'completado'),
    COUNT(*) FILTER (WHERE estado = 'parcial')
  INTO completados, parciales
  FROM public.lineamientos_estado
  WHERE proyecto_id = p_proyecto_id;

  RETURN LEAST(100, ((completados * 100 + parciales * 50) / total_modulos));
END;
$$;

-- Trigger: recalcular avance cuando cambia un lineamiento
CREATE OR REPLACE FUNCTION public.recalcular_avance_proyecto()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.proyectos
  SET avance = public.calcular_avance(NEW.proyecto_id)
  WHERE id = NEW.proyecto_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER recalcular_avance
  AFTER INSERT OR UPDATE ON public.lineamientos_estado
  FOR EACH ROW EXECUTE FUNCTION public.recalcular_avance_proyecto();

-- ================================================================
-- DATOS DE EJEMPLO (opcional — comentar en producción)
-- ================================================================
-- Los datos de demostración se gestionan desde la app con datos en memoria
-- hasta que el usuario conecte Supabase y registre proyectos reales.
