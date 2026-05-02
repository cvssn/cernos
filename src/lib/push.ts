import webpush from "web-push";

let configured = false;

export function configurePush(): boolean {
  if (configured) return true;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:noreply@cernos.app";
  if (!pub || !priv) return false;
  webpush.setVapidDetails(subject, pub, priv);
  configured = true;
  return true;
}

export function getPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY ?? null;
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

export async function sendPush(
  endpoint: string,
  keys: { p256dh: string; auth: string },
  payload: PushPayload
): Promise<{ ok: boolean; statusCode?: number; body?: string }> {
  if (!configurePush()) {
    return { ok: false, body: "vapid_unconfigured" };
  }
  try {
    await webpush.sendNotification(
      { endpoint, keys },
      JSON.stringify(payload),
      { TTL: 1800 }
    );
    return { ok: true };
  } catch (err) {
    const e = err as { statusCode?: number; body?: string; message?: string };
    return {
      ok: false,
      statusCode: e.statusCode,
      body: e.body || e.message,
    };
  }
}
