import { boolEnv } from '@/helpers/dbHelpers';
import Link from 'next/link';

export default function AdminHome() {
  return (
    <section className="section">
      <div className="container grid gap-4">
        <div className="tile">
          <div className="kicker">General</div>
          <h2 className="section-title">Dashboard</h2>
          {
            boolEnv('USE_MOCK', false) &&
            <p style={{ color: 'var(--muted)' }}>
              Estás en modo <strong>mock</strong>. Cualquier cambio se mostrará como “previa” y no se guardará.
            </p>
          }
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="tile">
            <h3>Eventos semanales</h3>
            <p className="mt-1" style={{ color: 'var(--muted)' }}>
              Crear/editar eventos repetitivos por día y horario.
            </p>
            <Link className="btn btn-ghost mt-3" href="/admin/events/weekly">Administrar</Link>
          </div>

          <div className="tile">
            <h3>Eventos de mundo</h3>
            <p className="mt-1" style={{ color: 'var(--muted)' }}>
              Crear eventos con rango de fechas, banner y destacados.
            </p>
            <Link className="btn btn-ghost mt-3" href="/admin/events/world">Administrar</Link>
          </div>

          <div className="tile">
            <h3>Donaciones</h3>
            <p className="mt-1" style={{ color: 'var(--muted)' }}>
              Items, montos y disponibilidad.
            </p>
            <Link className="btn btn-ghost mt-3" href="/admin/donations">Administrar</Link>
          </div>

          <div className="tile">
            <h3>Packs</h3>
            <p className="mt-1" style={{ color: 'var(--muted)' }}>
              Crea, edita y gestiona el contenido y la disponibilidad de los paquetes de ítems.
            </p>
            <Link className="btn btn-ghost mt-3" href="/admin/packs">Administrar</Link>
          </div>

          <div className="tile">
            <h3>Novedades</h3>
            <p className="mt-1" style={{ color: 'var(--muted)' }}>
              Crea y gestiona artículos de noticias, anuncios y actualizaciones del proyecto.
            </p>
            <Link className="btn btn-ghost mt-3" href="/admin/news">Administrar</Link>
          </div>

          <div className="tile">
            <h3>Reglas</h3>
            <p className="mt-1" style={{ color: 'var(--muted)' }}>
              Crea y gestiona artículos de reglas del proyecto.
            </p>
            <Link className="btn btn-ghost mt-3" href="/admin/rules">Administrar</Link>
          </div>

          <div className="tile">
            <h3>Quienes somos</h3>
            <p className="mt-1" style={{ color: 'var(--muted)' }}>
              Crea y gestiona artículos de presentaciones de integrantes del grupo y del proyecto.
            </p>
            <Link className="btn btn-ghost mt-3" href="/admin/about">Administrar</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
