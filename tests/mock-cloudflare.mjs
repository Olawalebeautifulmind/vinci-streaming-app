// A tiny stand-in for the Cloudflare Stream API so the go-live flow can be tested locally.
// Run: node tests/mock-cloudflare.mjs  then set CLOUDFLARE_API_BASE=http://127.0.0.1:8788/client/v4
// It mimics live input create/get/update/videos. It does not carry real video.
import http from "node:http";

const inputs = new Map();
const port = Number(process.env.PORT ?? 8788);
const host = `customer-mock.cloudflarestream.com`;

const send = (res, code, result) => {
  res.writeHead(code, { "content-type": "application/json" });
  res.end(
    JSON.stringify({
      success: code < 400,
      result,
      errors: code < 400 ? [] : [{ message: String(result) }],
    }),
  );
};

http
  .createServer(async (req, res) => {
    let body = "";
    for await (const c of req) body += c;
    const url = new URL(req.url, "http://x");
    if (url.pathname === "/__connect") {
      // test helper: mark a live input as connected
      const i = inputs.get(url.searchParams.get("uid"));
      if (i) i.status = { current: { state: "connected" } };
      return send(res, 200, i ?? null);
    }
    const m = url.pathname.match(
      /^\/client\/v4\/accounts\/[^/]+\/stream\/live_inputs(?:\/([^/]+))?(\/videos)?$/,
    );
    if (!m) return send(res, 404, "not found");
    if (
      req.headers.authorization !==
      `Bearer ${process.env.CLOUDFLARE_STREAM_API_TOKEN ?? "test-token"}`
    )
      return send(res, 401, "bad token");
    const [, uid, videos] = m;
    if (!uid && req.method === "POST") {
      const id = Math.random().toString(16).slice(2, 18);
      const input = {
        uid: id,
        meta: JSON.parse(body || "{}").meta,
        recording: JSON.parse(body || "{}").recording,
        enabled: true,
        rtmps: { url: "rtmps://live.cloudflare.com:443/live/", streamKey: `key${id}` },
        webRTC: { url: `https://${host}/secret${id}/webRTC/publish` },
        webRTCPlayback: { url: `https://${host}/${id}/webRTC/play` },
        status: null,
      };
      inputs.set(id, input);
      return send(res, 200, input);
    }
    const input = inputs.get(uid);
    if (!input) return send(res, 404, "no such live input");
    if (videos)
      return send(
        res,
        200,
        input.recording?.mode === "automatic" ? [{ uid: `vid${uid}`, readyToStream: true }] : [],
      );
    if (req.method === "PUT") {
      Object.assign(input, JSON.parse(body || "{}"));
      if (input.enabled === false) input.status = { current: { state: "client_disconnect" } };
      return send(res, 200, input);
    }
    return send(res, 200, input);
  })
  .listen(port, () => console.log(`mock Cloudflare Stream on :${port}`));
