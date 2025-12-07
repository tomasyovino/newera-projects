const SPHERE_HTTP_URL = process.env.SPHERE_HTTP_URL;
const SPHERE_HTTP_TOKEN = process.env.SPHERE_HTTP_TOKEN ?? '';

export async function sendSphereCommand(command: string): Promise<void> {
    if (!SPHERE_HTTP_URL) {
        console.log('[sphereClient] (dry-run) command =', command);
        return;
    }

    const res = await fetch(SPHERE_HTTP_URL, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'x-sphere-token': SPHERE_HTTP_TOKEN,
        },
        body: JSON.stringify({ command }),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(
            `Sphere HTTP error ${res.status}: ${text || 'no body'}`,
        );
    }
}
