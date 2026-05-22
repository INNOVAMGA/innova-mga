/**
 * Parchea todos los módulos para conectarlos a Supabase
 */
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const BASE = "src/app/proyectos/[id]";

const MODULES = [
  { key: "enfoque",       hasParams: false },
  { key: "localizacion",  hasParams: true  },
  { key: "disenos",       hasParams: true  },
  { key: "presupuesto",   hasParams: true  },
  { key: "pdn",           hasParams: true  },
  { key: "documentos",    hasParams: true  },
  { key: "normativas",    hasParams: true  },
];

let patched = 0;

for (const { key, hasParams } of MODULES) {
  const filePath = join(BASE, key, "page.tsx");
  let src = readFileSync(filePath, "utf8");
  const original = src;

  // 1. Agregar useEffect a los imports de React
  src = src.replace(
    /import \{ useState \} from "react";/,
    'import { useState, useEffect } from "react";'
  );
  // También para "useState, useMemo" u otras combinaciones
  src = src.replace(
    /import \{ (useState[^}]*) \} from "react";/,
    (_, inside) => {
      if (inside.includes("useEffect")) return `import { ${inside} } from "react";`;
      return `import { ${inside}, useEffect } from "react";`;
    }
  );

  // 2. Para enfoque: agregar useParams import
  if (!hasParams) {
    src = src.replace(
      /import { useState[^}]* } from "react";/,
      m => m + '\nimport { useParams } from "next/navigation";'
    );
  }

  // 3. Agregar import createClient (después del último import de @/components)
  if (!src.includes('from "@/lib/supabase/client"')) {
    src = src.replace(
      /(import \{[^}]+\} from "@\/components\/[^"]+";)\s*\n(?!import)/,
      (m) => m + '\nimport { createClient } from "@/lib/supabase/client";\n'
    );
    // Fallback: después de cualquier último import
    if (!src.includes('from "@/lib/supabase/client"')) {
      src = src.replace(
        /^((?:import .+\n)+)/m,
        (m) => m + 'import { createClient } from "@/lib/supabase/client";\n'
      );
    }
  }

  // 4. Para enfoque: agregar useParams call después de la función del componente
  if (!hasParams) {
    src = src.replace(
      /export default function \w+\(\) \{\n/,
      (m) => m + `  const params = useParams();\n  const proyectoId = params?.id as string;\n`
    );
  }

  // 5. Agregar useEffect de carga después de la línea "const params = useParams();"
  const loadEffect = `
  // Cargar datos guardados de Supabase
  useEffect(() => {
    if (!proyectoId) return;
    async function cargar() {
      const sb = createClient();
      const { data: lin } = await sb
        .from("lineamientos_estado")
        .select("datos")
        .eq("proyecto_id", proyectoId)
        .eq("modulo", "${key}")
        .maybeSingle();
      if (lin?.datos && Object.keys(lin.datos).length > 0) {
        setData(lin.datos as typeof data);
      }
    }
    cargar();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proyectoId]);
`;

  // Insertar después de los useState de saving/lastSaved
  if (!src.includes(`eq("modulo", "${key}")`)) {
    src = src.replace(
      /const \[lastSaved, setLastSaved\] = useState\(""\);(\s*\n)/,
      `const [lastSaved, setLastSaved] = useState("");\n${loadEffect}`
    );
  }

  // 6. Reemplazar el handleSave falso con uno real
  const realSave = `async function handleSave() {
    setSaving(true);
    try {
      const sb = createClient();
      // Calcular estado basado en si hay datos relevantes
      const tieneData = Object.values(data).some(v =>
        v !== "" && v !== null && v !== undefined &&
        !(Array.isArray(v) && v.length === 0)
      );
      const estado = tieneData ? "parcial" : "pendiente";
      await sb.from("lineamientos_estado").upsert(
        { proyecto_id: proyectoId, modulo: "${key}", datos: data as Record<string, unknown>, estado },
        { onConflict: "proyecto_id,modulo" }
      );
      setLastSaved(new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }));
    } catch (e) {
      console.error("Error guardando ${key}:", e);
    } finally {
      setSaving(false);
    }
  }`;

  // Reemplazar el handleSave falso
  src = src.replace(
    /async function handleSave\(\) \{\s*setSaving\(true\);\s*await new Promise\(r => setTimeout\(r, \d+\)\);\s*setSaving\(false\);\s*setLastSaved\([^;]+\);\s*\}/s,
    realSave
  );

  if (src !== original) {
    writeFileSync(filePath, src, "utf8");
    console.log(`✅ ${key} — parcheado`);
    patched++;
  } else {
    console.log(`⚠️  ${key} — sin cambios (revisar manualmente)`);
  }
}

console.log(`\n${patched}/${MODULES.length} módulos parcheados`);
