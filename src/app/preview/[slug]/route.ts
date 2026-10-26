import { renderMockup } from "@/lib/mockups";

export const dynamic = "force-dynamic";

// Public mockup preview. The page runs in a sandbox (its own origin), so its scripts can never reach the dashboard.
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const html = await renderMockup(slug);
  if (!html) return new Response("Preview not found", { status: 404, headers: { "Content-Type": "text/plain", "X-Robots-Tag": "noindex" } });
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow",
      "Content-Security-Policy": "sandbox allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals",
      "Cache-Control": "public, max-age=60",
    },
  });
}
