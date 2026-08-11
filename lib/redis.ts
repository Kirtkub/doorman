const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export const JOIN_EVENTS_KEY = "cleo_leo:join_events";

function getRedisConfig() {
  if (!REDIS_URL || !REDIS_TOKEN) {
    throw new Error("Upstash Redis is not configured");
  }

  return { url: REDIS_URL.replace(/\/+$/, ""), token: REDIS_TOKEN };
}

export async function redisCommand<T>(command: string[]): Promise<T> {
  const { url, token } = getRedisConfig();
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });

  const data = (await response.json()) as { result?: T; error?: string };
  if (!response.ok || data.error) {
    throw new Error(data.error || `Redis request failed with status ${response.status}`);
  }

  return data.result as T;
}

export type JoinEvent = {
  userId: number;
  firstName: string;
  lastName: string;
  username: string;
  language: string;
  joinedAt: string;
  channelId: number;
  channelName: string;
  inviteLink: string;
  inviteLinkLabel: string;
};

export async function recordJoinEvent(event: JoinEvent): Promise<void> {
  const score = Date.parse(event.joinedAt);
  const member = JSON.stringify({ ...event, id: `${event.userId}:${score}:${Date.now()}` });
  await redisCommand(["ZADD", JOIN_EVENTS_KEY, String(score), member]);
}

export async function readJoinEvents(minScore = "-inf", maxScore = "+inf"): Promise<JoinEvent[]> {
  const values = await redisCommand<string[]>([
    "ZRANGEBYSCORE",
    JOIN_EVENTS_KEY,
    minScore,
    maxScore,
  ]);

  return values.flatMap((value) => {
    try {
      const parsed = JSON.parse(value) as JoinEvent;
      return typeof parsed.channelId === "number" && parsed.joinedAt ? [parsed] : [];
    } catch {
      return [];
    }
  });
}