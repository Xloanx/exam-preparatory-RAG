const BACKEND_API_URL =
  process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export async function GET() {
  const res = await fetch(`${BACKEND_API_URL}/health`);
  const data = (await res.json().catch(() => ({ status: "ok" }))) as { status?: string };
  return Response.json(data, { status: res.status });
}
