import { singleton } from "@/lib/singleton";

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly url: string,
  ) {
    super(`Request ke ${new URL(url).host} gagal dengan status ${status}`);
    this.name = "HttpError";
  }
}

export const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

interface HostLane {
  tail: Promise<unknown>;
  lastStartedAt: number;
}

const lanes = singleton("http-lanes", () => new Map<string, HostLane>());

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function throttledFetch(url: string, minIntervalMs: number, init: RequestInit = {}): Promise<Response> {
  const host = new URL(url).host;
  const lane = lanes.get(host) ?? { tail: Promise.resolve(), lastStartedAt: 0 };
  lanes.set(host, lane);

  const run = async () => {
    await sleep(Math.max(0, lane.lastStartedAt + minIntervalMs - Date.now()));
    lane.lastStartedAt = Date.now();
    const response = await fetch(url, {
      ...init,
      headers: { "user-agent": BROWSER_USER_AGENT, "accept-language": "en-US,en;q=0.9", ...init.headers },
      signal: init.signal ?? AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new HttpError(response.status, url);
    return response;
  };

  const request = lane.tail.then(run, run);
  lane.tail = request.catch(() => undefined);
  return request;
}
