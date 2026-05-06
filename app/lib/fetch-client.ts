// Fetch wrapper that intentionally triggers HTML responses
// In "broken" mode, any non-matching request returns index.html

export async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url);
  const contentType = res.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    throw new Error(
      `Expected JSON, got ${contentType}. First 100 chars: ${(await res.clone().text()).slice(0, 100)}`
    );
  }

  return res.json();
}
