import type { NextApiRequest, NextApiResponse } from "next";
import { CHANNELS } from "../../lib/channels";
import { readJoinEvents, type JoinEvent } from "../../lib/redis";

const PERIODS = {
  "24h": { durationMs: 24 * 60 * 60 * 1000, bucketMs: 60 * 60 * 1000 },
  "7d": { durationMs: 7 * 24 * 60 * 60 * 1000, bucketMs: 12 * 60 * 60 * 1000 },
  "14d": { durationMs: 14 * 24 * 60 * 60 * 1000, bucketMs: 24 * 60 * 60 * 1000 },
  "30d": { durationMs: 30 * 24 * 60 * 60 * 1000, bucketMs: 24 * 60 * 60 * 1000 },
  all: { durationMs: 0, bucketMs: 24 * 60 * 60 * 1000 },
} as const;

type Period = keyof typeof PERIODS;

function isPeriod(value: string): value is Period {
  return value in PERIODS;
}

function getChannel(value: string) {
  return CHANNELS.find((channel) => String(channel.chatId) === value) || CHANNELS[0];
}

function bucketStart(timestamp: number, start: number, bucketMs: number): number {
  return start + Math.floor((timestamp - start) / bucketMs) * bucketMs;
}

function formatBucket(timestamp: number, period: Period): string {
  return new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: period === "24h" ? undefined : "numeric",
    hour: "numeric",
    ...(period === "24h" ? {} : { minute: undefined }),
  });
}

function buildChart(events: JoinEvent[], period: Period, defaultInviteLink: { url: string; label: string }) {
  const config = PERIODS[period];
  const now = Date.now();
  const eventTimes = events.map((event) => Date.parse(event.joinedAt)).filter(Number.isFinite);
  const rawStart = period === "all" ? Math.min(...eventTimes, now) : now - config.durationMs;
  const start = bucketStart(rawStart, 0, config.bucketMs);
  const end = bucketStart(now, 0, config.bucketMs);
  const bucketCount = Math.max(1, Math.floor((end - start) / config.bucketMs) + 1);
  const links = Array.from(new Set([defaultInviteLink.url, ...events.map((event) => event.inviteLink)]));
  const points = Array.from({ length: bucketCount }, (_, index) => {
    const timestamp = start + index * config.bucketMs;
    const matching = events.filter((event) => {
      const joinedAt = Date.parse(event.joinedAt);
      return joinedAt >= timestamp && joinedAt < timestamp + config.bucketMs;
    });

    return {
      label: formatBucket(timestamp, period),
      timestamp,
      total: matching.length,
      counts: links.reduce<Record<string, number>>((result, link) => {
        result[link] = matching.filter((event) => event.inviteLink === link).length;
        return result;
      }, {}),
    };
  });

  return {
    labels: points.map((point) => point.label),
    timestamps: points.map((point) => point.timestamp),
    total: points.map((point) => point.total),
    links: links.map((link) => ({
      url: link,
      label: events.find((event) => event.inviteLink === link)?.inviteLinkLabel ||
        (link === defaultInviteLink.url ? defaultInviteLink.label : link),
      values: points.map((point) => point.counts[link] || 0),
    })),
  };
}

function buildLanguages(events: JoinEvent[], selectedInviteLink: string) {
  const counts = events
    .filter((event) => event.inviteLink === selectedInviteLink)
    .reduce<Record<string, number>>((result, event) => {
      const language = event.language || "Unknown";
      result[language] = (result[language] || 0) + 1;
      return result;
    }, {});
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const visible = entries.filter(([, count]) => total === 0 || count / total >= 0.05);
  const other = entries
    .filter(([, count]) => total > 0 && count / total < 0.05)
    .reduce((sum, [, count]) => sum + count, 0);

  return [
    ...visible.map(([language, count]) => ({ language, count })),
    ...(other > 0 ? [{ language: "Other", count: other }] : []),
  ];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const periodValue = typeof req.query.period === "string" ? req.query.period : "7d";
  const period = isPeriod(periodValue) ? periodValue : "7d";
  const channel = getChannel(typeof req.query.channel === "string" ? req.query.channel : "");
  const requestedInvite = typeof req.query.inviteLink === "string" ? req.query.inviteLink : "";

  try {
    const now = Date.now();
    const minimum = period === "all" ? "-inf" : String(now - PERIODS[period].durationMs);
    const allEvents = await readJoinEvents(minimum, "+inf");
    const events = allEvents.filter((event) => event.channelId === channel.chatId);
    const chart = buildChart(events, period, {
      url: channel.inviteLink,
      label: channel.inviteLinkLabel,
    });
    const selectedInviteLink = chart.links.some((link) => link.url === requestedInvite)
      ? requestedInvite
      : chart.links[0]?.url || channel.inviteLink;

    return res.status(200).json({
      channel: { id: channel.chatId, name: channel.name },
      channels: CHANNELS.map((item) => ({ id: item.chatId, name: item.name })),
      period,
      chart,
      languages: buildLanguages(events, selectedInviteLink),
      selectedInviteLink,
      totalUsers: events.length,
      inviteLinks: chart.links,
    });
  } catch (error) {
    console.error("Stats request failed:", error);
    return res.status(503).json({ error: "Statistics are temporarily unavailable" });
  }
}