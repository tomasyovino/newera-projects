'use client';

import { useMemo, useState } from 'react';
import type { Rule } from '@/lib/types';

type FormValue = Omit<Rule, 'id' | 'createdAt' | 'updatedAt'> & { id?: string };
type Lang = 'es' | 'en';

export default function RuleForm({
    value,
    onCancel,
    onSaved,
}: {
    value?: Rule;
    onCancel?: () => void;
    onSaved?: () => void;
}) {
    const initial: FormValue = useMemo<FormValue>(() => {
        if (value) {
            return {
                id: value.id,
                slug: value.slug,
                title: value.title,
                body: value.body,
                category: value.category ?? undefined,
                tags: value.tags ?? [],
                sort: value.sort,
                active: !!value.active,
            };
        }
        return {
            slug: '',
            title: { es: '', en: '' },
            body: { es: '', en: '' },
            category: undefined,
            tags: [],
            sort: 0,
            active: true,
        };
    }, [value]);

    const [data, setData] = useState<FormValue>(initial);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [tagsText, setTagsText] = useState((data.tags ?? []).join(', '));
    const [showPreview, setShowPreview] = useState<'es' | 'en' | null>(null);

    const applyTags = (s: string): string[] =>
        s.split(',').map(t => t.trim()).filter(Boolean);

    // --------- Importar desde Markdown (front-matter) ----------
    function castYamlValue(v: string) {
        const t = v.trim();
        if (/^(true|false)$/i.test(t)) return /^true$/i.test(t);
        if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
        const q = t.match(/^"(.*)"$|^'(.*)'$/);
        if (q) return (q[1] ?? q[2] ?? '').trim();
        return t;
    }

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
            }
        }

        if (typeof meta.tags === 'string') {
            meta.tags = meta.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
        }
        if (typeof meta.active === 'string') {
            meta.active = /^true|1|yes$/i.test(meta.active);
        }
        if (typeof meta.sort === 'string' && /^-?\d+(\.\d+)?$/.test(meta.sort)) {
            meta.sort = Number(meta.sort);
        }

        return { meta, content };
    }

    async function handleMdFile(file: File | null, lang: Lang) {
        if (!file) return;
        const text = await file.text();
        const { meta, content } = parseFrontMatter(text);

        // ¿Trae metadatos "globales"?
        const hasGlobals = Object.keys(meta).some(k =>
            ['slug', 'category', 'tags', 'sort', 'active'].includes(k)
        );
        const confirmGlobals = () =>
            confirm('El archivo contiene metadatos (slug / category / tags / sort / active). ¿Aplicarlos también?');

        setData(prev => {
            const next = { ...prev };

            // Cuerpo por idioma
            next.body = { ...next.body, [lang]: content };

            // Por idioma
            if (meta.title) {
                const apply = !next.title?.[lang] || confirm(`¿Sobrescribir Título ${lang.toUpperCase()}?`);
                if (apply) next.title = { ...next.title, [lang]: String(meta.title) };
            }

            // Globales (si el .md los trae y el usuario acepta)
            if (hasGlobals && confirmGlobals()) {
                if (meta.slug) next.slug = String(meta.slug);
                if (meta.category) next.category = String(meta.category);
                if (Array.isArray(meta.tags)) next.tags = meta.tags as string[];
                if (typeof meta.sort === 'number' && Number.isFinite(meta.sort)) next.sort = meta.sort;
                if (typeof meta.active === 'boolean') next.active = meta.active;
            }

            return next;
        });

        if (Array.isArray(meta.tags) && meta.tags.length) {
            setTagsText(meta.tags.join(', '));
        }
    }

    // --------- Submit ----------
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErr(null);

        const payload = {
            slug: data.slug.trim(),
            title: { es: data.title.es.trim(), en: data.title.en.trim() },
            body: { es: data.body.es, en: data.body.en },
            category: data.category?.trim() ? data.category.trim() : undefined,
            tags: applyTags(tagsText),
            sort: Number.isFinite(data.sort) ? Number(data.sort) : 0,
            active: !!data.active,
        };

        if (!payload.slug) return setErr('El slug es obligatorio.');
        if (!payload.title.es || !payload.title.en) return setErr('El título ES/EN es obligatorio.');
        if (!payload.body.es || !payload.body.en) return setErr('El cuerpo (markdown) ES/EN es obligatorio.');

        setBusy(true);
        try {
            const isEdit = !!value?.id;
            const url = isEdit ? `/api/admin/rules/${value!.id}` : '/api/admin/rules';
            const method = isEdit ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                let msg = 'Error al guardar';
                try { const j = await res.json(); msg = j?.error ? JSON.stringify(j.error) : msg; } catch { }
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
                    <div className="kicker">Regla</div>
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

            {/* Slug / Orden / Activa */}
            <div className="grid md:grid-cols-3 gap-3">
                <label className="grid gap-1">
                    <span>Slug</span>
                    <input
                        className="input"
                        placeholder="reglas-generales"
                        value={data.slug}
                        onChange={e => setData({ ...data, slug: e.target.value })}
                    />
                </label>
                <label className="grid gap-1">
                    <span>Orden</span>
                    <input
                        type="number"
                        className="input"
                        value={data.sort}
                        onChange={e => setData({ ...data, sort: Number(e.target.value) })}
                    />
                </label>
                <label className="grid gap-1">
                    <span>Activa</span>
                    <select
                        className="input admin-select"
                        value={data.active ? '1' : '0'}
                        onChange={e => setData({ ...data, active: e.target.value === '1' })}
                    >
                        <option value="1">Sí</option>
                        <option value="0">No</option>
                    </select>
                </label>
            </div>

            {/* Categoría */}
            <label className="grid gap-1">
                <span>Categoría (opcional)</span>
                <input
                    className="input"
                    placeholder="general / social / sistema…"
                    value={data.category ?? ''}
                    onChange={e => setData({ ...data, category: e.target.value || undefined })}
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

            {/* Importar desde Markdown */}
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
                    Front-matter YAML soportado: <code>title</code>, <code>slug</code>, <code>category</code>, <code>tags</code>, <code>sort</code>, <code>active</code>.
                    El contenido posterior al front-matter se toma como el cuerpo **Markdown** del idioma elegido.
                </div>
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
                        Vista previa ({showPreview.toUpperCase()}): *en público se renderiza con Markdown + estilos; aquí mostramos texto crudo*.
                    </div>
                )}
            </div>

            {/* Tags */}
            <label className="grid gap-1">
                <span>Tags (separadas por coma)</span>
                <input
                    className="input"
                    placeholder="reglas, social, sistema"
                    value={tagsText}
                    onChange={e => setTagsText(e.target.value)}
                    onBlur={e => setTagsText(applyTags(e.target.value).join(', '))}
                />
            </label>
        </form>
    );
}
