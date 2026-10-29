// সালথা সংবাদ — ফেসবুক প্রিভিউর জন্য Cloudflare Worker
const PROJECT = 'saltha-sangbad';
const SITE = 'https://salthasangbad.github.io';
const NAME = 'সালথা সংবাদ';
const FS = 'https://firestore.googleapis.com/v1/projects/' + PROJECT + '/databases/(default)/documents/';
const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function loadState() {
  const r = await fetch(FS + 'site/state');
  if (!r.ok) return null;
  try { return JSON.parse((await r.json()).fields.json.stringValue); } catch (e) { return null; }
}

export default {
  async fetch(req) {
    const u = new URL(req.url);
    let m;
    if ((m = u.pathname.match(/^\/img\/(i\d+)$/))) {
      const r = await fetch(FS + 'images/' + m[1]);
      if (!r.ok) return new Response('not found', { status: 404 });
      const d = (await r.json()).fields.d.stringValue;
      const bin = Uint8Array.from(atob(d.split(',')[1]), c => c.charCodeAt(0));
      return new Response(bin, { headers: { 'content-type': 'image/jpeg', 'cache-control': 'public, max-age=86400' } });
    }
    if ((m = u.pathname.match(/^\/n\/(\d+)$/))) {
      const S = await loadState();
      const n = S && (S.news || []).find(x => x.id === +m[1]);
      if (!n) return Response.redirect(SITE + '/', 302);
      const dest = SITE + '/#n' + n.id;
      const img = n.im ? u.origin + '/img/' + n.im : (n.i && /^https:\/\//.test(n.i) ? n.i : SITE + '/og.jpg');
      const desc = (n.b || '').replace(/\s+/g, ' ').slice(0, 200);
      const html = '<!DOCTYPE html><html lang="bn"><head><meta charset="utf-8"><title>' + esc(n.t) + '</title>'
        + '<meta property="og:type" content="article"><meta property="og:site_name" content="' + NAME + '">'
        + '<meta property="og:title" content="' + esc(n.t) + '"><meta property="og:description" content="' + esc(desc) + '">'
        + '<meta property="og:image" content="' + esc(img) + '"><meta property="og:url" content="' + esc(u.href) + '">'
        + '<meta name="twitter:card" content="summary_large_image"></head><body>'
        + '<script>location.replace(' + JSON.stringify(dest) + ')</script>'
        + '<a href="' + dest + '">খবরটি পড়ুন</a></body></html>';
      return new Response(html, { headers: { 'content-type': 'text/html;charset=utf-8', 'cache-control': 'public, max-age=300' } });
    }
    return Response.redirect(SITE + '/', 302);
  }
};
