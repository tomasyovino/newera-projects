'use client';

import { useMemo, useState } from 'react';
import type { AboutEntry } from '@/lib/types';

type FormValue = Omit<AboutEntry, 'id' | 'createdAt' | 'updatedAt'> & { id?: string };
type Lang = 'es' | 'en';

export default function AboutForm({
    value,
    onCancel,
    onSaved,
}: {
    value?: AboutEntry;
    onCancel?: () => void;
    onSaved?: () => void;
}) {
    const initial: FormValue = useMemo<FormValue>(() => {
        if (value) {
            return {
                id: value.id,
                slug: value.slug,
                title: value.title,
                role: value.role ?? undefined,
                avatar: value.avatar ?? undefined,
                body: value.body,
                tags: value.tags ?? [],
                sort: value.sort,
                active: !!value.active,
            };
        }
        return {
            slug: '',
            title: { es: '', en: '' },
            role: undefined,
            avatar: undefined,
            body: { es: '', en: '' },
            tags: [],
            sort: 0,
            active: true,
        };
    }, [value]);

    const [data, setData] = useState<FormValue>(initial);
    const [tagsText, setTagsText] = useState((data.tags ?? []).join(', '));
    const [showPreview, setShowPreview] = useState<'es' | 'en' | null>(null);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const applyTags = (s: string): string[] =>
        s.split(',').map(t => t.trim()).filter(Boolean);

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

        const askGlobals = Object.keys(meta).some(k =>
            ['slug', 'avatar', 'role', 'tags', 'sort', 'active'].includes(k)
        );

        const confirmGlobals = () =>
            confirm('El archivo contiene metadatos globales (slug / avatar / role / tags / sort / active). ¿Aplicarlos también?');

        setData(prev => {
            const next = { ...prev };

            next.body = { ...next.body, [lang]: content };

            if (meta.title) {
                const apply = !next.title?.[lang] || confirm(`¿Sobrescribir Título ${lang.toUpperCase()}?`);
                if (apply) next.title = { ...next.title, [lang]: String(meta.title) };
            }

            if (askGlobals && confirmGlobals()) {
                if (meta.slug) next.slug = String(meta.slug);
                if (meta.avatar) next.avatar = String(meta.avatar);
                if (meta.role) next.role = String(meta.role);
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

    // ---------- Submit ----------
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErr(null);

        const payload = {
            slug: data.slug.trim(),
            title: { es: data.title.es.trim(), en: data.title.en.trim() },
            role: data.role?.trim() ? data.role.trim() : undefined,
            avatar: data.avatar?.trim() ? data.avatar.trim() : undefined,
            body: { es: data.body.es, en: data.body.en },
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
            const url = isEdit ? `/api/admin/about/${value!.id}` : '/api/admin/about';
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
                    <div className="kicker">Quiénes Somos</div>
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
                        placeholder="marakawau / dr4k3n / mencion-especial…"
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

            {/* Avatar / Rol */}
            <div className="grid md:grid-cols-2 gap-3">
                <label className="grid gap-1">
                    <span>Avatar (URL — opcional)</span>
                    <input
                        className="input"
                        placeholder="https://…/avatar.webp"
                        value={data.avatar ?? ''}
                        onChange={e => setData({ ...data, avatar: e.target.value || undefined })}
                    />
                </label>
                <label className="grid gap-1">
                    <span>Rol / Cargo (opcional)</span>
                    <input
                        className="input"
                        placeholder="Administrador, Desarrollador, Moderador…"
                        value={data.role ?? ''}
                        onChange={e => setData({ ...data, role: e.target.value || undefined })}
                    />
                </label>
            </div>

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
                    Front-matter YAML soportado: <code>title</code>, <code>role</code>, <code>avatar</code>, <code>slug</code>, <code>tags</code>, <code>sort</code>, <code>active</code>.
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
                        Vista previa ({showPreview.toUpperCase()}): *en público se renderiza con Markdown + estilos; aquí es texto crudo*.
                    </div>
                )}
            </div>

            {/* Tags */}
            <label className="grid gap-1">
                <span>Tags (separadas por coma)</span>
                <input
                    className="input"
                    placeholder="staff, dev, arte…"
                    value={tagsText}
                    onChange={e => setTagsText(e.target.value)}
                    onBlur={e => setTagsText(applyTags(e.target.value).join(', '))}
                />
            </label>
        </form>
    );
}
