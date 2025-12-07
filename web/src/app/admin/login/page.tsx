export const dynamic = 'force-dynamic';

export default function AdminLoginPage() {
  return (
    <section className="section">
      <div className="container max-w-md">
        <div className="tile">
          <h1 className="section-title">Acceso administrador</h1>
          <p className="mt-1" style={{ color: 'var(--muted)' }}>
            Ingresa tus credenciales para continuar.
          </p>

          <form
            action="/api/auth/login"
            method="post"
            className="grid gap-3 mt-4"
          >
            <label className="grid gap-1">
              <span>Usuario</span>
              <input name="username" className="input" required />
            </label>

            <label className="grid gap-1">
              <span>Contraseña</span>
              <input name="password" type="password" className="input" required />
            </label>

            <button className="btn btn-primary mt-2" type="submit">
              Entrar
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
