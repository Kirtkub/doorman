import { useEffect, useMemo, useRef, useState } from "react";

type Period = "24h" | "7d" | "14d" | "30d" | "all";
type Stats = {
  channel: { id: number; name: string };
  channels: { id: number; name: string }[];
  period: Period;
  chart: {
    labels: string[];
    timestamps: number[];
    total: number[];
    links: { url: string; label: string; values: number[] }[];
  };
  languages: { language: string; count: number }[];
  selectedInviteLink: string;
  totalUsers: number;
};

const periods: { value: Period; label: string }[] = [
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "14d", label: "Last 14 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "all", label: "All time" },
];

const colors = ["#22c55e", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4"];

function LineChart({ stats, visibleLinks, totalVisible, onToggle }: {
  stats: Stats;
  visibleLinks: Record<string, boolean>;
  totalVisible: boolean;
  onToggle: (series: string) => void;
}) {
  const width = 820;
  const height = 300;
  const padding = { top: 24, right: 20, bottom: 44, left: 42 };
  const values = [
    ...(totalVisible ? stats.chart.total : []),
    ...stats.chart.links.flatMap((link) => visibleLinks[link.url] ? link.values : []),
  ];
  const max = Math.max(1, ...values);
  const x = (index: number) => padding.left + (index / Math.max(1, stats.chart.labels.length - 1)) * (width - padding.left - padding.right);
  const y = (value: number) => height - padding.bottom - (value / max) * (height - padding.top - padding.bottom);
  const path = (valuesToPlot: number[]) => valuesToPlot.map((value, index) => `${index === 0 ? "M" : "L"} ${x(index)} ${y(value)}`).join(" ");
  const labelIndexes = stats.chart.labels.length <= 8
    ? stats.chart.labels.map((_, index) => index)
    : [0, Math.floor(stats.chart.labels.length / 2), stats.chart.labels.length - 1];

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Users joined over time">
        {[0, 0.5, 1].map((ratio) => (
          <g key={ratio}>
            <line x1={padding.left} x2={width - padding.right} y1={y(max * ratio)} y2={y(max * ratio)} className="grid-line" />
            <text x={padding.left - 10} y={y(max * ratio) + 4} textAnchor="end" className="axis-label">{Math.round(max * ratio)}</text>
          </g>
        ))}
        {stats.chart.links.map((link, index) => visibleLinks[link.url] && (
          <path key={link.url} d={path(link.values)} fill="none" stroke={colors[index % colors.length]} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        ))}
        {totalVisible && <path d={path(stats.chart.total)} fill="none" stroke="#172033" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />}
        {labelIndexes.map((index) => (
          <text key={index} x={x(index)} y={height - 15} textAnchor="middle" className="axis-label">{stats.chart.labels[index]}</text>
        ))}
      </svg>
      <div className="legend" aria-label="Chart series visibility controls">
        <button
          className={`legend-item series-button ${totalVisible ? "" : "muted"}`}
          aria-pressed={totalVisible}
          onClick={() => onToggle("__total")}
          style={{ borderColor: totalVisible ? "#172033" : undefined, color: totalVisible ? "#172033" : undefined }}
        >
          <span className="legend-dot total-dot" />Total users
        </button>
        {stats.chart.links.map((link, index) => (
          <button
            key={link.url}
            className={`legend-item series-button ${visibleLinks[link.url] ? "" : "muted"}`}
            aria-pressed={visibleLinks[link.url]}
            onClick={() => onToggle(link.url)}
            style={{
              borderColor: visibleLinks[link.url] ? colors[index % colors.length] : undefined,
              color: visibleLinks[link.url] ? colors[index % colors.length] : undefined,
            }}
          >
            <span className="legend-dot" style={{ background: colors[index % colors.length] }} />{link.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function LanguagePie({ languages }: { languages: Stats["languages"] }) {
  const total = languages.reduce((sum, item) => sum + item.count, 0);
  let offset = 0;
  const segments = languages.map((item, index) => {
    const percentage = total ? item.count / total : 0;
    const segment = { ...item, percentage, offset };
    offset += percentage;
    return segment;
  });
  const radius = 86;
  const center = 110;
  const polarToCartesian = (angle: number) => ({
    x: center + radius * Math.cos(angle),
    y: center + radius * Math.sin(angle),
  });
  const arcPath = (startRatio: number, endRatio: number) => {
    const startAngle = startRatio * Math.PI * 2 - Math.PI / 2;
    const endAngle = endRatio * Math.PI * 2 - Math.PI / 2;
    const start = polarToCartesian(startAngle);
    const end = polarToCartesian(endAngle);
    const largeArc = endRatio - startRatio > 0.5 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  };

  return (
    <div className="language-content">
      <div className="pie">
        <svg viewBox="0 0 220 220" role="img" aria-label={`User languages: ${total} users`}>
          <circle
            className="pie-track"
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#edf0f4"
            strokeWidth="26"
          />
          {segments.map((segment, index) => (
            <path
              key={segment.language}
              className="pie-segment"
              d={arcPath(segment.offset, segment.offset + segment.percentage)}
              fill="none"
              stroke={colors[index % colors.length]}
              strokeWidth="26"
            />
          ))}
        </svg>
        <div className="pie-hole"><strong>{total}</strong><span>users</span></div>
      </div>
      <div className="language-list">
        {segments.length ? segments.map((segment, index) => (
          <div className="language-row" key={segment.language}>
            <span className="legend-dot" style={{ background: colors[index % colors.length] }} />
            <span>{segment.language}</span><strong>{Math.round(segment.percentage * 100)}%</strong>
          </div>
        )) : <p className="empty">No language data for this invite link yet.</p>}
      </div>
    </div>
  );
}

export default function Home() {
  const [channel, setChannel] = useState("");
  const [period, setPeriod] = useState<Period>("7d");
  const [inviteLink, setInviteLink] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [webhookStatus, setWebhookStatus] = useState("");
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [visibleLinks, setVisibleLinks] = useState<Record<string, boolean>>({});
  const [totalVisible, setTotalVisible] = useState(true);
  const lastRequestedKey = useRef("");

  useEffect(() => {
    const requestKey = `${channel}|${period}|${inviteLink}`;
    if (lastRequestedKey.current === requestKey) {
      return;
    }
    lastRequestedKey.current = requestKey;
    const query = new URLSearchParams({ period });
    if (channel) query.set("channel", channel);
    if (inviteLink) query.set("inviteLink", inviteLink);
    setLoading(true);
    fetch(`/api/stats?${query.toString()}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load statistics");
        return data as Stats;
      })
      .then((data) => {
        setStats(data);
        lastRequestedKey.current = `${String(data.channel.id)}|${data.period}|${data.selectedInviteLink}`;
        setChannel(String(data.channel.id));
        setInviteLink(data.selectedInviteLink);
        setVisibleLinks((previous) => Object.fromEntries(data.chart.links.map((link) => [link.url, previous[link.url] !== false])));
        setError("");
      })
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [channel, period, inviteLink]);

  const handleFilterChange = (nextChannel: string, nextPeriod: Period, nextInvite = inviteLink) => {
    setChannel(nextChannel);
    setPeriod(nextPeriod);
    setInviteLink(nextInvite);
  };

  const channelOptions = useMemo(() => stats?.channels || [], [stats]);

  const setWebhook = async () => {
    setWebhookLoading(true);
    setWebhookStatus("Setting webhook...");
    try {
      const response = await fetch("/api/set-webhook", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const data = await response.json();
      setWebhookStatus(data.success ? `Webhook active: ${data.webhookUrl}` : `Error: ${data.error || "Failed to set webhook"}`);
    } catch {
      setWebhookStatus("Could not reach the webhook endpoint.");
    } finally {
      setWebhookLoading(false);
    }
  };

  return (
    <main>
      <header className="topbar">
        <div className="brand"><div className="brand-mark">C<span>&</span>L</div><div><strong>Cleo & Leo</strong><small>Telegram insights</small></div></div>
        <button className="webhook-button" onClick={setWebhook} disabled={webhookLoading}>{webhookLoading ? "Setting..." : "Set Webhook"}</button>
      </header>
      <div className="page">
        <section className="intro"><div><p className="eyebrow">COMMUNITY OVERVIEW</p><h1>Join activity</h1><p className="subheading">Track channel growth and understand where your community comes from.</p></div><div className="live-badge"><span />Live data</div></section>
        <section className="filters card">
          <label>Channel<select value={channel} onChange={(event) => handleFilterChange(event.target.value, period)}>{channelOptions.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label>
          <label>Time period<select value={period} onChange={(event) => handleFilterChange(channel, event.target.value as Period)}>{periods.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <div className="refresh-note"><span className="refresh-icon">↻</span> Refreshes on filter change</div>
        </section>
        {webhookStatus && <div className="notice">{webhookStatus}</div>}
        {error ? <section className="card error">{error}<p>Check that the Upstash Redis secrets are configured for this deployment.</p></section> : (
          <>
            <section className="stats-grid"><div className="stat-card card"><span>Total joins</span><strong>{loading ? "—" : stats?.totalUsers ?? 0}</strong><small>{periods.find((item) => item.value === period)?.label}</small></div><div className="stat-card card"><span>Invite links</span><strong>{loading ? "—" : stats?.chart.links.length ?? 0}</strong><small>Tracking sources</small></div><div className="stat-card card"><span>Languages</span><strong>{loading ? "—" : stats?.languages.length ?? 0}</strong><small>Selected invite link</small></div></section>
            <section className="card chart-card"><div className="section-heading"><div><p className="eyebrow">GROWTH</p><h2>New users over time</h2></div><span className="interval">Intervals: {period === "24h" ? "1 hour" : period === "7d" ? "12 hours" : "1 day"}</span></div>{loading || !stats ? <div className="loading">Loading chart...</div> : <LineChart stats={stats} visibleLinks={visibleLinks} totalVisible={totalVisible} onToggle={(series) => series === "__total" ? setTotalVisible((previous) => !previous) : setVisibleLinks((previous) => ({ ...previous, [series]: !previous[series] }))} />}</section>
            <section className="card language-card"><div className="section-heading"><div><p className="eyebrow">AUDIENCE</p><h2>User languages</h2></div><select value={inviteLink} onChange={(event) => handleFilterChange(channel, period, event.target.value)}>{stats?.chart.links.map((link) => <option key={link.url} value={link.url}>{link.label}</option>)}</select></div>{loading || !stats ? <div className="loading">Loading languages...</div> : <LanguagePie languages={stats.languages} />}</section>
          </>
        )}
      </div>
      <style jsx>{`
        :global(*) { box-sizing: border-box; }
        :global(body) { margin: 0; background: #f5f7fa; color: #172033; font-family: Inter, ui-sans-serif, system-ui, -apple-system, sans-serif; }
        main { min-height: 100vh; }
        .topbar { height: 76px; padding: 0 5vw; display: flex; align-items: center; justify-content: space-between; background: #fff; border-bottom: 1px solid #e7eaf0; }
        .brand { display: flex; align-items: center; gap: 11px; } .brand strong { display: block; font-size: 14px; letter-spacing: .02em; } .brand small { color: #8a94a6; font-size: 11px; }
        .brand-mark { width: 38px; height: 38px; display: grid; place-items: center; border-radius: 11px; color: #fff; background: #172033; font-size: 12px; font-weight: 800; letter-spacing: -.15em; padding-right: 3px; } .brand-mark span { color: #f7b84b; font-size: 9px; margin: 0 1px; }
        button, select { font: inherit; } button { cursor: pointer; }
        .webhook-button { border: 1px solid #d9dee8; border-radius: 7px; background: #fff; color: #455066; padding: 8px 13px; font-size: 12px; } .webhook-button:hover { border-color: #172033; } .webhook-button:disabled { opacity: .55; cursor: wait; }
        .page { width: min(1120px, 90vw); margin: 0 auto; padding: 54px 0 70px; } .intro { display: flex; align-items: end; justify-content: space-between; margin-bottom: 30px; } .eyebrow { margin: 0 0 8px; color: #9aa4b5; font-size: 10px; font-weight: 800; letter-spacing: .15em; } h1 { margin: 0; font-size: clamp(28px, 4vw, 40px); letter-spacing: -.04em; } .subheading { color: #7b879a; margin: 10px 0 0; font-size: 14px; } .live-badge { display: flex; align-items: center; gap: 7px; color: #4f5b6e; font-size: 12px; } .live-badge span { width: 7px; height: 7px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 0 4px #dcfce7; }
        .card { background: #fff; border: 1px solid #e8ebf0; border-radius: 12px; box-shadow: 0 5px 20px rgba(30, 42, 65, .035); } .filters { display: flex; align-items: end; gap: 28px; padding: 18px 20px; margin-bottom: 22px; } label { color: #8b95a7; font-size: 10px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; } select { display: block; min-width: 210px; margin-top: 7px; padding: 9px 30px 9px 11px; border: 1px solid #dfe4ec; border-radius: 6px; color: #273348; background: #fff; font-size: 13px; text-transform: none; letter-spacing: normal; } .refresh-note { margin-left: auto; color: #a0a9b8; font-size: 11px; } .refresh-icon { margin-right: 5px; font-size: 15px; }
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 18px; } .stat-card { padding: 20px 22px; } .stat-card span, .stat-card small { display: block; color: #8b95a7; font-size: 11px; } .stat-card strong { display: block; margin: 8px 0 5px; font-size: 30px; letter-spacing: -.04em; } .stat-card small { color: #b0b7c3; }
        .chart-card, .language-card { padding: 24px; margin-bottom: 18px; } .section-heading { display: flex; align-items: start; justify-content: space-between; gap: 15px; } h2 { margin: 0; font-size: 18px; letter-spacing: -.025em; } .interval { color: #a0a9b8; font-size: 11px; padding-top: 16px; } .chart-wrap { overflow-x: auto; margin-top: 14px; } .chart-wrap > svg { display: block; width: 100%; min-width: 620px; } .grid-line { stroke: #edf0f4; stroke-width: 1; } .axis-label { fill: #a5adba; font-size: 10px; } .legend { display: flex; flex-wrap: wrap; gap: 9px; margin: 12px 0 0 42px; } .legend-item { border: 0; padding: 0; background: none; color: #697487; font-size: 11px; } .series-button { display: inline-flex; align-items: center; gap: 7px; border: 1px solid #e4e8ef; border-radius: 999px; padding: 7px 11px; background: #fff; transition: border-color .2s, background .2s, color .2s, opacity .2s; } .series-button:hover { background: #f8fafc; } .series-button.muted { color: #aeb6c3 !important; border-color: #e4e8ef !important; opacity: .72; text-decoration: line-through; } .legend-dot { display: inline-block; width: 8px; height: 8px; flex: 0 0 8px; border-radius: 50%; } .total-dot { background: #172033; }
        .language-card .section-heading select { min-width: 230px; margin-top: 0; } .language-content { display: flex; align-items: center; gap: 55px; padding: 24px 10px 8px; } .pie { position: relative; width: 190px; height: 190px; flex: 0 0 190px; display: grid; place-items: center; border-radius: 50%; filter: drop-shadow(0 10px 18px rgba(23, 32, 51, .08)); } .pie > svg { display: block; width: 100%; height: 100%; transform: rotate(-90deg); } .pie-track, .pie-segment { fill: none; stroke-width: 26; } .pie-track { stroke: #edf0f4; } .pie-segment { stroke-linecap: butt; transition: stroke-dasharray .35s ease, stroke-dashoffset .35s ease; } .pie-hole { position: absolute; inset: 39px; display: grid; place-content: center; text-align: center; border-radius: 50%; background: #fff; box-shadow: inset 0 0 0 1px #eef1f5; } .pie-hole strong { font-size: 25px; letter-spacing: -.04em; } .pie-hole span { color: #a2abba; font-size: 11px; } .language-list { width: min(330px, 100%); } .language-row { display: flex; align-items: center; padding: 11px 0; border-bottom: 1px solid #eff1f5; color: #667286; font-size: 13px; } .language-row strong { margin-left: auto; color: #273348; } .empty, .loading { color: #a2abba; font-size: 13px; padding: 40px 0; text-align: center; } .notice, .error { margin-bottom: 18px; padding: 14px 18px; color: #4f5b6e; font-size: 13px; } .error { border-left: 3px solid #ef4444; } .error p { margin: 7px 0 0; color: #9aa4b5; font-size: 12px; }
        @media (max-width: 700px) { .page { padding-top: 34px; } .intro { align-items: start; gap: 20px; flex-direction: column; } .filters { align-items: stretch; flex-direction: column; gap: 14px; } select { width: 100%; } .refresh-note { margin: 0; } .stats-grid { gap: 9px; } .stat-card { padding: 15px; } .stat-card strong { font-size: 23px; } .language-content { align-items: start; flex-direction: column; gap: 20px; } .language-card .section-heading { flex-direction: column; } .language-card .section-heading select { width: 100%; } .pie { width: 160px; height: 160px; align-self: center; } }
      `}</style>
    </main>
  );
}