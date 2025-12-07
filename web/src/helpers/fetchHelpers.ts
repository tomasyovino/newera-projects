const VM_API_BASE = process.env.VM_API_BASE_URL!;
const INTERNAL_KEY = process.env.VM_INTERNAL_API_KEY!;

export async function fetchFromVM(
    path: string,
    opts?: RequestInit,
): Promise<Response> {
    const headers = new Headers(opts?.headers ?? {});
    headers.set('x-internal-key', INTERNAL_KEY);

    return fetch(`${VM_API_BASE}${path}`, {
        ...opts,
        cache: 'no-store',
        headers,
    });
}
