const CATBOX_API = "https://catbox.moe/user/api.php";
const CATBOX_HOST = "https://files.catbox.moe/";
const MAX_BYTES = 100 * 1024 * 1024;

function json(data, status=200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {"content-type":"application/json; charset=utf-8","cache-control":"no-store"}
  });
}

function encodeUrl(url) {
  return btoa(url).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
function decodeUrl(token) {
  token = token.replace(/-/g,"+").replace(/_/g,"/");
  while (token.length % 4) token += "=";
  return atob(token);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Upload: browser -> Worker -> Catbox. The file is streamed; it is not buffered.
    if (url.pathname === "/api/upload" && request.method === "POST") {
      const length = Number(request.headers.get("content-length") || 0);
      if (length && length > MAX_BYTES) return json({error:"Maksimal 100 MB per file."}, 413);
      if (!request.body) return json({error:"File kosong."}, 400);

      const headers = new Headers();
      headers.set("content-type", request.headers.get("content-type") || "application/octet-stream");
      headers.set("user-agent", "XCY-Image-Host/1.0");

      const upstream = await fetch(CATBOX_API, {
        method: "POST",
        headers,
        body: request.body
      });

      const text = (await upstream.text()).trim();
      if (!upstream.ok || !text.startsWith(CATBOX_HOST)) {
        return json({error:"Catbox menolak upload.", detail:text.slice(0,300)}, 502);
      }

      const token = encodeUrl(text);
      return json({url: `${url.origin}/files/${token}.xcy`, source:text});
    }

    // Custom public URL: /files/<encoded-catbox-url>.xcy
    if (url.pathname.startsWith("/files/") && request.method === "GET") {
      const name = url.pathname.slice("/files/".length);
      if (!name.endsWith(".xcy")) return new Response("Not Found", {status:404});
      const token = name.slice(0,-4);
      try {
        const target = decodeUrl(token);
        if (!target.startsWith(CATBOX_HOST)) return new Response("Not Found",{status:404});
        const upstream = await fetch(target, {
          headers: {"user-agent":"XCY-Image-Host/1.0"}
        });
        if (!upstream.ok) return new Response("File tidak ditemukan.",{status:404});
        const h = new Headers(upstream.headers);
        h.set("cache-control","public, max-age=31536000, immutable");
        h.set("access-control-allow-origin","*");
        return new Response(upstream.body,{status:200,headers:h});
      } catch {
        return new Response("Not Found",{status:404});
      }
    }

    // Let Cloudflare Static Assets serve index.html and other static files.
    return env.ASSETS.fetch(request);
  }
};
