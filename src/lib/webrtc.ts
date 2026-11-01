// Minimal WHIP (publish) and WHEP (play) clients for Cloudflare Stream WebRTC.
// https://developers.cloudflare.com/stream/webrtc-beta/

const ICE = [{ urls: "stun:stun.cloudflare.com:3478" }];

async function negotiate(pc: RTCPeerConnection, endpoint: string) {
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  await waitForIce(pc, 2000);
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/sdp" },
    body: pc.localDescription!.sdp,
  });
  if (!res.ok) throw new Error(`WebRTC handshake failed (HTTP ${res.status})`);
  const answer = await res.text();
  await pc.setRemoteDescription({ type: "answer", sdp: answer });
  const location = res.headers.get("Location");
  return location ? new URL(location, endpoint).toString() : null;
}

function waitForIce(pc: RTCPeerConnection, timeoutMs: number) {
  if (pc.iceGatheringState === "complete") return Promise.resolve();
  return new Promise<void>((resolve) => {
    const t = setTimeout(done, timeoutMs);
    function done() {
      clearTimeout(t);
      pc.removeEventListener("icegatheringstatechange", check);
      resolve();
    }
    function check() {
      if (pc.iceGatheringState === "complete") done();
    }
    pc.addEventListener("icegatheringstatechange", check);
  });
}

export type Session = { pc: RTCPeerConnection; stop: () => Promise<void> };

export async function publishWhip(endpoint: string, media: MediaStream): Promise<Session> {
  const pc = new RTCPeerConnection({ iceServers: ICE, bundlePolicy: "max-bundle" });
  for (const track of media.getTracks()) pc.addTransceiver(track, { direction: "sendonly" });
  const resource = await negotiate(pc, endpoint);
  return {
    pc,
    stop: async () => {
      pc.close();
      if (resource) await fetch(resource, { method: "DELETE" }).catch(() => {});
    },
  };
}

export async function playWhep(endpoint: string, video: HTMLVideoElement): Promise<Session> {
  const pc = new RTCPeerConnection({ iceServers: ICE, bundlePolicy: "max-bundle" });
  pc.addTransceiver("video", { direction: "recvonly" });
  pc.addTransceiver("audio", { direction: "recvonly" });
  const remote = new MediaStream();
  pc.ontrack = (e) => {
    remote.addTrack(e.track);
    video.srcObject = remote;
  };
  const resource = await negotiate(pc, endpoint);
  return {
    pc,
    stop: async () => {
      pc.close();
      if (resource) await fetch(resource, { method: "DELETE" }).catch(() => {});
    },
  };
}

/** customer-<code>.cloudflarestream.com host, read from any Cloudflare Stream URL. */
export function streamHost(url: string | null | undefined) {
  if (!url) return null;
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}
