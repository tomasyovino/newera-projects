import '../../styles/global.css';
import type { ReactNode } from 'react';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/images/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/images/favicon-16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/images/favicon-180.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/images/favicon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/images/favicon-512.png" />
        <title>Admin · New Era</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        {/* Fondo */}
        <div className="bg-scene" />
        <div className="bg-dots" />
        <div className="vignette" />

        {/* Header compacto */}
        <div className="header-wrap">
          <div className="header">
            <Link href="/admin" className="brand">
              <span className="brand-title">Admin</span>
            </Link>

            <nav className="nav">
              <Link href="/admin">Dashboard</Link>
              <Link href="/admin/events/weekly">Eventos semanales</Link>
              <Link href="/admin/events/world">Eventos de mundo</Link>
              <Link href="/admin/donations">Donaciones</Link>
              <Link href="/admin/packs">Packs</Link>
              <Link href="/admin/news">Novedades</Link>
              <Link href="/admin/rules">Reglas</Link>
              <Link href="/admin/about">Quienes Somos</Link>
            </nav>

            <form action="/api/auth/logout" method="post">
              <button className="btn btn-ghost" type="submit">Salir</button>
            </form>
          </div>
        </div>

        <main className="main-pad">
          <div className="container">{children}</div>
        </main>
      </body>
    </html>
  );
}
