'use client';

import { useState } from 'react';
import { z } from 'zod';
import type { WeeklyEvent } from '@/lib/types';

const timeRe = /^([01]\d|2[0-3]):([0-5]\d)$/;

const DAYS = [
    { v: 1, es: 'Lunes', en: 'Monday' },
    { v: 2, es: 'Martes', en: 'Tuesday' },
    { v: 3, es: 'Miércoles', en: 'Wednesday' },
    { v: 4, es: 'Jueves', en: 'Thursday' },
    { v: 5, es: 'Viernes', en: 'Friday' },
    { v: 6, es: 'Sábado', en: 'Saturday' },
    { v: 7, es: 'Domingo', en: 'Sunday' },
];

const formSchema = z.object({
    id: z.string().optional(),
    name: z.object({
        es: z.string().min(1, 'Nombre ES requerido'),
        en: z.string().min(1, 'Name EN requerido'),
    }),
    description: z
        .object({
            es: z.string().optional(),
            en: z.string().optional(),
        })
        .optional(),
    dayOfWeek: z.number().int().min(1).max(7),
    times: z
        .array(z.string().regex(timeRe, 'Formato HH:mm'))
        .min(1, 'Agrega al menos un horario')
        .refine((arr) => new Set(arr).size === arr.length, 'Horarios duplicados'),
    durationMinutes: z.number().int().min(0).optional(),
    featured: z.boolean(),
    icon: z.string().url().or(z.string().min(1)).optional(),
    sphereCmd: z.string().trim().optional(),
});

export type EventFormProps = {
    initial?: WeeklyEvent;
    onSubmit: (data: Omit<WeeklyEvent, 'id'> & { id?: string }) => Promise<void>;
    submitLabel?: string;
};

export default function EventForm({ initial, onSubmit, submitLabel = 'Guardar' }: EventFormProps) {
    const [data, setData] = useState<Omit<WeeklyEvent, 'id'> & { id?: string }>(
        initial ?? {
            name: { es: '', en: '' },
            description: { es: '', en: '' },
            dayOfWeek: 1,
            times: [],
            durationMinutes: 60,
            featured: false,
            icon: undefined,
            sphereCmd: undefined,
        },
    );
    const [timeInput, setTimeInput] = useState('');
    const [err, setErr] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const addTime = () => {
        const t = timeInput.trim();
        if (!timeRe.test(t)) { setErr('Hora inválida (usa HH:mm)'); return; }
        if (data.times.includes(t)) return;
        setData({ ...data, times: [...data.times, t].sort((a, b) => a.localeCompare(b)) });
        setTimeInput('');
        setErr(null);
    };
    const delTime = (t: string) => setData({ ...data, times: data.times.filter(x => x !== t) });

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErr(null);

        const cleaned = {
            ...data,
            sphereCmd: data.sphereCmd?.trim() ? data.sphereCmd.trim() : undefined,
        };

        try {
            formSchema.parse(cleaned);
        } catch (e: any) {
            setErr('Revisá los campos. ' + (e?.issues?.[0]?.message ?? ''));
            return;
        }
        setBusy(true);
        try {
            await onSubmit(cleaned);
        } catch (e: any) {
            setErr(e?.message ?? 'Error al guardar');
        } finally {
            setBusy(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="grid gap-3">
            {/* Nombre */}
            <div className="grid md:grid-cols-2 gap-3">
                <label className="grid gap-1">
                    <span>Nombre (ES)</span>
                    <input className="input" value={data.name.es}
                        onChange={e => setData({ ...data, name: { ...data.name, es: e.target.value } })} />
                </label>
                <label className="grid gap-1">
                    <span>Name (EN)</span>
                    <input className="input" value={data.name.en}
                        onChange={e => setData({ ...data, name: { ...data.name, en: e.target.value } })} />
                </label>
            </div>

            {/* Descripción */}
            <div className="grid md:grid-cols-2 gap-3">
                <label className="grid gap-1">
                    <span>Descripción (ES)</span>
                    <textarea
                        className="input"
                        rows={3}
                        value={data.description?.es ?? ''}
                        onChange={e =>
                            setData(d => ({
                                ...d,
                                description: {
                                    es: e.target.value,
                                    en: d.description?.en ?? '',
                                },
                            }))
                        }
                    />
                </label>

                <label className="grid gap-1">
                    <span>Description (EN)</span>
                    <textarea
                        className="input"
                        rows={3}
                        value={data.description?.en ?? ''}
                        onChange={e =>
                            setData(d => ({
                                ...d,
                                description: {
                                    es: d.description?.es ?? '',
                                    en: e.target.value,
                                },
                            }))
                        }
                    />
                </label>
            </div>

            {/* Día + featured */}
            <div className="grid md:grid-cols-3 gap-3">
                <label className="grid gap-1">
                    <span>Día de la semana</span>
                    <select className="input admin-select" value={data.dayOfWeek}
                        onChange={e => setData({ ...data, dayOfWeek: Number(e.target.value) })}>
                        {DAYS.map(d => <option key={d.v} value={d.v}>{d.es} / {d.en}</option>)}
                    </select>
                </label>

                <label className="grid gap-1">
                    <span>Duración (min)</span>
                    <input className="input admin-select" type="number" min={0} value={data.durationMinutes ?? 0}
                        onChange={e => setData({ ...data, durationMinutes: Number(e.target.value || 0) })} />
                </label>

                <label className="grid gap-1">
                    <span>Destacado</span>
                    <select className="input admin-select" value={data.featured ? '1' : '0'}
                        onChange={e => setData({ ...data, featured: e.target.value === '1' })}>
                        <option value="0">No</option>
                        <option value="1">Sí</option>
                    </select>
                </label>
            </div>

            {/* Icono opcional */}
            <label className="grid gap-1">
                <span>Icono (opcional, URL)</span>
                <input className="input" value={data.icon ?? ''}
                    onChange={e => setData({ ...data, icon: e.target.value || undefined })} />
            </label>

            {/* Comando Sphere opcional */}
            <label className="grid gap-1">
                <span>Comando Sphere (opcional)</span>
                <input
                    className="input"
                    placeholder=".addnpc orc_captain en ... (ejemplo)"
                    value={data.sphereCmd ?? ''}
                    onChange={e => setData({ ...data, sphereCmd: e.target.value })}
                />
                <span className="note text-xs">
                    Se ejecuta automáticamente cada vez que llegue el día y horario configurado.
                </span>
            </label>

            {/* Horarios */}
            <div className="grid gap-2">
                <span>Horarios (HH:mm)</span>
                <div className="flex gap-2">
                    <input
                        className="input"
                        placeholder="13:00"
                        value={timeInput}
                        onChange={e => setTimeInput(e.target.value)}
                        onKeyDown={e => (e.key === 'Enter' ? (e.preventDefault(), addTime()) : undefined)}
                    />
                    <button type="button" className="btn btn-ghost" onClick={addTime}>Añadir</button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {data.times.map(t => (
                        <span key={t} className="chip" style={{ cursor: 'pointer' }} onClick={() => delTime(t)} title="Quitar">
                            {t} x
                        </span>
                    ))}
                    {data.times.length === 0 && <span className="note">No hay horarios añadidos.</span>}
                </div>
            </div>

            {err && <div className="we-warning">{err}</div>}

            <div className="flex gap-2 mt-2">
                <button className="btn btn-primary w-[140px] justify-center" disabled={busy}>
                    {busy ? 'Guardando…' : submitLabel}
                </button>
            </div>
        </form>
    );
}
