// brookeballhaus.com: static site plus one endpoint, POST /api/note, that emails
// "Drop me a note" messages to Brooke through Cloudflare Email Routing.
import { EmailMessage } from "cloudflare:email";

const TO = "ballhaus@stanford.edu";
const FROM = "notes@brookeballhaus.com";

const clean = (v, max) => String(v ?? "").replace(/[\r\n]+/g, " ").trim().slice(0, max);
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== "/api/note") return env.ASSETS.fetch(request);
    if (request.method !== "POST") return json({ ok: false, error: "method" }, 405);

    // Only accept posts from the site itself.
    const origin = request.headers.get("origin") || "";
    if (origin && !/^https:\/\/(www\.)?brookeballhaus\.com$/.test(origin)) return json({ ok: false, error: "origin" }, 403);

    let data;
    try { data = await request.json(); } catch { return json({ ok: false, error: "bad request" }, 400); }

    // Honeypot and a minimum time on the form keep most bots out.
    if (data.website) return json({ ok: true });
    if (Number(data.elapsed) < 2500) return json({ ok: false, error: "too fast" }, 400);

    const name = clean(data.name, 120);
    const email = clean(data.email, 200);
    const message = String(data.message ?? "").replace(/\r\n?/g, "\n").trim().slice(0, 5000);
    if (!name || !message || !/^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(email)) return json({ ok: false, error: "missing fields" }, 422);

    const subject = `Note from ${name} via brookeballhaus.com`;
    const b64 = s => btoa(String.fromCharCode(...new TextEncoder().encode(s)));
    const body = `${message}\n\n--\n${name}\n${email}\nSent from the note form on brookeballhaus.com\n`;
    const raw = [
      `From: "brookeballhaus.com" <${FROM}>`,
      `To: <${TO}>`,
      `Reply-To: "${name.replace(/"/g, "")}" <${email}>`,
      `Subject: =?UTF-8?B?${b64(subject)}?=`,
      `Message-ID: <${crypto.randomUUID()}@brookeballhaus.com>`,
      `Date: ${new Date().toUTCString()}`,
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=UTF-8",
      "Content-Transfer-Encoding: base64",
      "",
      b64(body).replace(/.{76}/g, "$&\r\n"),
    ].join("\r\n");

    try {
      await env.NOTES.send(new EmailMessage(FROM, TO, raw));
      return json({ ok: true });
    } catch (err) {
      console.error("send failed", err);
      return json({ ok: false, error: "send failed" }, 502);
    }
  },
};
