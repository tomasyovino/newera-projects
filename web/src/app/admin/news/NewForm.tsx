'use client';

import { useMemo, useState } from 'react';
import type { New, LocalizedString } from '@/lib/types';

type FormValue = Omit<New, 'id' | 'createdAt' | 'updatedAt'> & { id?: string };
type Lang = 'es' | 'en';

const toLocalInput = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const toISO = (local: string) => local ? new Date(local).toISOString() : null;

const emptyLS = (v?: Partial<LocalizedString>): LocalizedString => ({ es: v?.es ?? '', en: v?.en ?? '' });

export default function NewForm({
  value,
  onCancel,
  onSaved,
}: {
  value?: New;
  onCancel?: () => void;
  onSaved?: () => void;
}) {
  const initial: FormValue = useMemo<FormValue>(() => {
    if (value) {
      return {
        id: value.id,
        slug: value.slug,
        title: value.title,
        excerpt: value.excerpt ?? undefined,
        body: value.body,
        cover: value.cover ?? undefined,
        tags: value.tags ?? [],
        featured: !!value.featured,
        publishedAt: value.publishedAt ?? null,
      };
    }
    const now = new Date();
    return {
      slug: '',
      title: { es: '', en: '' },
      excerpt: { es: '', en: '' },
      body: { es: '', en: '' },
      cover: undefined,
      tags: [],
      featured: false,
      publishedAt: null,
    };
  }, [value]);

  const [data, setData] = useState<FormValue>(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState<'es' | 'en' | null>(null);
  const [tagsText, setTagsText] = useState((data.tags ?? []).join(', '));

  function parseFrontMatter(md: string): { meta: Record<string, any>, content: string } {
    const m = md.match(/^---\s*[\r\n]+([\s\S]*?)[\r\n]+---\s*[\r\n]*/);
    if (!m) return { meta: {}, content: md };

    const yaml = m[1];
    const content = md.slice(m[0].length);

    const meta: Record<string, any> = {};
    const lines = yaml.split(/\r?\n/);
    let currentKey: string | null = null;
    let listMode = false;

    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;

      if (listMode && line.startsWith('- ')) {
        const v = line.slice(2).trim();
        if (currentKey) (meta[currentKey] ||= []).push(castYamlValue(v));
        continue;
      }

      const kv = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
      if (kv) {
        currentKey = kv[1];
        const rhs = kv[2];

        if (rhs === '' || rhs === null) {
          meta[currentKey] = [];
          listMode = true;
        } else {
          listMode = false;
          meta[currentKey] = castYamlValue(rhs);
        }
      } else {
      }
    }

    if (typeof meta.tags === 'string') {
      meta.tags = meta.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
    }
    if (typeof meta.featured === 'string') {
      meta.featured = /^true|1|yes$/i.test(meta.featured);
    }
    if (meta.publishedAt && typeof meta.publishedAt === 'string') {
      const d = new Date(meta.publishedAt);
      if (!isNaN(d.valueOf())) meta.publishedAt = d.toISOString();
    }

    return { meta, content };
  }

  function castYamlValue(v: string) {
    const t = v.trim();
    if (/^true|false$/i.test(t)) return /^true$/i.test(t);
    if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
    const q = t.match(/^"(.*)"$|^'(.*)'$/);
    if (q) return (q[1] ?? q[2] ?? '').trim();
    return t;
  }

  async function handleMdFile(file: File | null, lang: Lang) {
    if (!file) return;
    const text = await file.text();
    const { meta, content } = parseFrontMatter(text);

    const confirmOverwrite = () => confirm(
      'El archivo contiene metadatos (front-matter). ¿Deseás aplicar también slug/cover/tags/featured/publishedAt y títulos/excerpt?'
    );

    setData(prev => {
      let next = { ...prev };

      next.body = { ...next.body, [lang]: content };

      if (meta.title) {
        const apply = !next.title?.[lang] || confirm(`¿Sobrescribir Título ${lang.toUpperCase()}?`);
        if (apply) next.title = { ...next.title, [lang]: String(meta.title) };
      }
      if (meta.excerpt) {
        const apply = !next.excerpt?.[lang] || confirm(`¿Sobrescribir Excerpt ${lang.toUpperCase()}?`);
        if (apply) next.excerpt = { ...(next.excerpt ?? { es: '', en: '' }), [lang]: String(meta.excerpt) };
      }

      // Campos "globales": solo desde el primer archivo que subas (o confirmar)
      if (Object.keys(meta).length && confirmOverwrite()) {
        if (meta.slug) next.slug = String(meta.slug);
        if (meta.cover) next.cover = String(meta.cover);
        if (Array.isArray(meta.tags)) next.tags = meta.tags as string[];
        if (typeof meta.featured === 'boolean') next.featured = meta.featured;
        if (meta.publishedAt) next.publishedAt = String(meta.publishedAt);
      }

      return next;
    });

    // Actualizamos texto de tags visible en el input de tags
    if (Array.isArray(meta.tags) && meta.tags.length) {
      setTagsText(meta.tags.join(', '));
    }
  }

  const applyTags = (s: string): string[] => s
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    const payload = {
      slug: data.slug.trim(),
      title: { es: data.title.es.trim(), en: data.title.en.trim() },
      excerpt: (data.excerpt?.es || data.excerpt?.en) ? {
        es: data.excerpt?.es ?? '',
        en: data.excerpt?.en ?? '',
      } : undefined,
      body: { es: data.body.es, en: data.body.en },
      cover: data.cover?.trim() ? data.cover.trim() : undefined,
      tags: applyTags(tagsText),
      featured: !!data.featured,
      publishedAt: data.publishedAt ? data.publishedAt : null,
    };

    if (!payload.slug) {
      setErr('El slug es obligatorio.');
      return;
    }
    if (!payload.title.es || !payload.title.en) {
      setErr('El título ES/EN es obligatorio.');
      return;
    }
    if (!payload.body.es || !payload.body.en) {
      setErr('El cuerpo (markdown) ES/EN es obligatorio.');
      return;
    }

    setBusy(true);
    try {
      const isEdit = !!value?.id;
      const url = isEdit ? `/api/admin/news/${value!.id}` : '/api/admin/news';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        let msg = 'Error al guardar';
        try {
          const j = await res.json();
          msg = j?.error ? JSON.stringify(j.error) : msg;
        } catch { }
        throw new Error(msg);
      }
      onSaved?.();
    } catch (e: any) {
      setErr(e?.message ?? 'Error al guardar');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3">
      <div className="tile-cta">
        <div>
          <div className="kicker">Novedad</div>
          <h2 className="section-title">{value ? 'Editar' : 'Nueva'}</h2>
        </div>
        <div className="flex gap-2">
          {onCancel && (
            <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={busy}>
              Cancelar
            </button>
          )}
          <button className="btn btn-primary" disabled={busy}>
            {busy ? 'Guardando…' : (value ? 'Guardar cambios' : 'Crear')}
          </button>
        </div>
      </div>

      {err && <div className="we-warning">{err}</div>}

      {/* Slug + Featured */}
      <div className="grid md:grid-cols-3 gap-3">
        <label className="grid gap-1">
          <span>Slug</span>
          <input
            className="input"
            placeholder="mi-novedad"
            value={data.slug}
            onChange={e => setData({ ...data, slug: e.target.value })}
          />
        </label>
        <label className="grid gap-1">
          <span>Publicación (opcional)</span>
          <input
            type="datetime-local"
            className="input"
            value={toLocalInput(data.publishedAt ?? undefined)}
            onChange={e => {
              const v = e.target.value;
              setData({ ...data, publishedAt: v ? toISO(v) : null });
            }}
          />
        </label>
        <label className="grid gap-1">
          <span>Destacado</span>
          <select
            className="input admin-select"
            value={data.featured ? '1' : '0'}
            onChange={e => setData({ ...data, featured: e.target.value === '1' })}
          >
            <option value="0">No</option>
            <option value="1">Sí</option>
          </select>
        </label>
      </div>

      {/* Cover */}
      <label className="grid gap-1">
        <span>Portada (URL — opcional)</span>
        <input
          className="input"
          placeholder="https://…/cover.webp"
          value={data.cover ?? ''}
          onChange={e => setData({ ...data, cover: e.target.value || undefined })}
        />
      </label>

      {/* Títulos */}
      <div className="grid md:grid-cols-2 gap-3">
        <label className="grid gap-1">
          <span>Título (ES)</span>
          <input
            className="input"
            value={data.title.es}
            onChange={e => setData(d => ({ ...d, title: { es: e.target.value, en: d.title.en } }))}
          />
        </label>
        <label className="grid gap-1">
          <span>Title (EN)</span>
          <input
            className="input"
            value={data.title.en}
            onChange={e => setData(d => ({ ...d, title: { es: d.title.es, en: e.target.value } }))}
          />
        </label>
      </div>

      {/* Excerpt opcional */}
      <div className="grid md:grid-cols-2 gap-3">
        <label className="grid gap-1">
          <span>Bajada/Resumen (ES) — opcional</span>
          <textarea
            className="input"
            rows={2}
            value={data.excerpt?.es ?? ''}
            onChange={e => setData(d => ({ ...d, excerpt: emptyLS({ ...d.excerpt, es: e.target.value }) }))}
          />
        </label>
        <label className="grid gap-1">
          <span>Excerpt (EN) — optional</span>
          <textarea
            className="input"
            rows={2}
            value={data.excerpt?.en ?? ''}
            onChange={e => setData(d => ({ ...d, excerpt: emptyLS({ ...d.excerpt, en: e.target.value }) }))}
          />
        </label>
      </div>

      {/* Body markdown */}
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <span>Contenido (Markdown)</span>
          <div className="flex gap-2">
            <button type="button" className="btn btn-ghost" onClick={() => setShowPreview(p => p === 'es' ? null : 'es')}>Preview ES</button>
            <button type="button" className="btn btn-ghost" onClick={() => setShowPreview(p => p === 'en' ? null : 'en')}>Preview EN</button>
          </div>
        </div>
        <div className="grid gap-2">
          <span style={{ fontWeight: 600 }}>Importar desde Markdown</span>
          <div className="grid md:grid-cols-2 gap-3">
            <label className="grid gap-1">
              <span>Archivo ES (.md)</span>
              <input
                type="file"
                accept=".md,text/markdown,text/plain"
                className="input"
                onChange={(e) => handleMdFile(e.target.files?.[0] || null, 'es')}
              />
            </label>
            <label className="grid gap-1">
              <span>Archivo EN (.md)</span>
              <input
                type="file"
                accept=".md,text/markdown,text/plain"
                className="input"
                onChange={(e) => handleMdFile(e.target.files?.[0] || null, 'en')}
              />
            </label>
          </div>
          <div className="note">
            Soporta front-matter YAML: <code>title</code>, <code>excerpt</code>, <code>slug</code>, <code>cover</code>,
            <code>tags</code>, <code>featured</code>, <code>publishedAt</code>. El contenido después del front-matter es el cuerpo en Markdown.
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <textarea
            className="input"
            rows={10}
            placeholder="Markdown ES…"
            value={data.body.es}
            onChange={e => setData(d => ({ ...d, body: { es: e.target.value, en: d.body.en } }))}
          />
          <textarea
            className="input"
            rows={10}
            placeholder="Markdown EN…"
            value={data.body.en}
            onChange={e => setData(d => ({ ...d, body: { es: d.body.es, en: e.target.value } }))}
          />
        </div>

        {showPreview && (
          <div className="note">
            Vista previa ({showPreview.toUpperCase()}): *renderizar en público; acá sólo texto crudo por ahora*.
          </div>
        )}
      </div>

      {/* Tags */}
      <label className="grid gap-1">
        <span>Tags (separadas por coma)</span>
        <input
          className="input"
          placeholder="evento, server, actualización"
          value={tagsText}
          onChange={e => setTagsText(e.target.value)}
          onBlur={e => setTagsText(applyTags(e.target.value).join(', '))}
        />
      </label>
    </form>
  );
}
