/** Public origin from proxy headers (Railway, nginx, Cloudflare, etc.). */
export function requestOriginFromHeaders(headerList: Headers): string {
  const host =
    headerList.get("x-forwarded-host") ??
    headerList.get("host") ??
    "localhost:3000";
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}
