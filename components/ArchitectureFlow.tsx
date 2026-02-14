"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Background,
  ReactFlow,
  type Edge,
  type Node,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useTheme } from "@/lib/theme";

interface ArchitectureFlowProps {
  className?: string;
  height?: number;
}

function nodeLabel(title: string, subtitle: string): ReactNode {
  return (
    <div className="text-[11px] leading-snug whitespace-pre-line">
      <div className="font-semibold text-sm">{title}</div>
      <div className="opacity-80 mt-1">{subtitle}</div>
    </div>
  );
}

function getStyles(isDark: boolean) {
  const frontendStyle = {
    border: isDark ? "1px solid rgba(139, 92, 246, 0.45)" : "1px solid rgba(124, 58, 237, 0.5)",
    background: isDark
      ? "linear-gradient(135deg, rgba(30, 15, 60, 0.95), rgba(15, 25, 55, 0.95))"
      : "linear-gradient(135deg, rgba(237, 228, 255, 0.97), rgba(219, 234, 254, 0.97))",
    color: isDark ? "#e9d5ff" : "#4c1d95",
    borderRadius: 14,
    width: 245,
  };

  const workflowStyle = {
    border: isDark ? "1px solid rgba(20, 184, 166, 0.50)" : "1px solid rgba(13, 148, 136, 0.5)",
    background: isDark
      ? "linear-gradient(135deg, rgba(10, 35, 35, 0.95), rgba(10, 40, 30, 0.95))"
      : "linear-gradient(135deg, rgba(220, 252, 245, 0.97), rgba(209, 250, 229, 0.97))",
    color: isDark ? "#ccfbf1" : "#134e4a",
    borderRadius: 14,
    width: 245,
  };

  const externalStyle = {
    border: isDark ? "1px solid rgba(245, 158, 11, 0.50)" : "1px solid rgba(180, 83, 9, 0.5)",
    background: isDark
      ? "linear-gradient(135deg, rgba(45, 25, 10, 0.95), rgba(50, 35, 5, 0.95))"
      : "linear-gradient(135deg, rgba(254, 243, 199, 0.97), rgba(254, 249, 195, 0.97))",
    color: isDark ? "#fef3c7" : "#78350f",
    borderRadius: 14,
    width: 245,
  };

  return { frontendStyle, workflowStyle, externalStyle };
}

type LayoutMode = "desktop" | "tablet" | "mobile";

function makeNodes(layout: LayoutMode, styles: ReturnType<typeof getStyles>): Node[] {
  const { frontendStyle, workflowStyle, externalStyle } = styles;

  if (layout === "desktop") {
    // 3-column layout: Frontend | Workflows | External
    const col1 = 40, col2 = 470, col3 = 900;
    const row = (i: number) => 90 + i * 110;
    return [
      { id: "pipeline", position: { x: col1, y: row(0) }, data: { label: nodeLabel("📄 /pipeline", "Upload → Parse → Score → Questions") }, type: "default", style: frontendStyle },
      { id: "health", position: { x: col1, y: row(1) }, data: { label: nodeLabel("🩺 /api/health", "Uptime • AI metrics • Error rates") }, type: "default", style: frontendStyle },
      { id: "automations", position: { x: col1, y: row(2) }, data: { label: nodeLabel("⚙️ /automations", "Dashboard • Test workflows • Audio") }, type: "default", style: frontendStyle },
      { id: "api", position: { x: col1, y: row(3) }, data: { label: nodeLabel("🔌 API Layer", "/api/n8n/sync • outreach • report\n/api/tts • /api/nocodb") }, type: "default", style: frontendStyle },
      { id: "wf1", position: { x: col2, y: row(0) }, data: { label: nodeLabel("WF1 Candidate Intake", "Route by score • Alerts") }, type: "default", style: workflowStyle },
      { id: "wf2", position: { x: col2, y: row(1) }, data: { label: nodeLabel("WF2 Smart Outreach", "Personalized email + voice") }, type: "default", style: workflowStyle },
      { id: "wf3", position: { x: col2, y: row(2) }, data: { label: nodeLabel("WF3 Data Sync", "NocoDB push \u2022 Tracker") }, type: "default", style: workflowStyle },
      { id: "wf4", position: { x: col2, y: row(3) }, data: { label: nodeLabel("WF4 Health Monitor", "Cron every 5 min") }, type: "default", style: workflowStyle },
      { id: "wf5", position: { x: col2, y: row(4) }, data: { label: nodeLabel("WF5 Pipeline Report", "Weekly analytics") }, type: "default", style: workflowStyle },
      { id: "el", position: { x: col3, y: row(0) }, data: { label: nodeLabel("\uD83D\uDD0A Kokoro TTS", "Voice AI (Self-Hosted)") }, type: "default", style: externalStyle },
      { id: "air", position: { x: col3, y: row(1) }, data: { label: nodeLabel("\uD83D\uDDC2\uFE0F NocoDB", "Candidate CRM") }, type: "default", style: externalStyle },
      { id: "or", position: { x: col3, y: row(2) }, data: { label: nodeLabel("🧠 OpenRouter", "Llama 3.3 + GPT-4o fallback") }, type: "default", style: externalStyle },
    ];
  }

  // tablet: 2-column layout — Frontend+External left, Workflows right
  const col1 = 20, col2 = 310;
  const row = (i: number) => 20 + i * 105;
  return [
    { id: "pipeline", position: { x: col1, y: row(0) }, data: { label: nodeLabel("📄 /pipeline", "Upload → Parse → Score → Questions") }, type: "default", style: { ...frontendStyle, width: 230 } },
    { id: "health", position: { x: col1, y: row(1) }, data: { label: nodeLabel("🩺 /api/health", "Uptime • AI metrics • Error rates") }, type: "default", style: { ...frontendStyle, width: 230 } },
    { id: "automations", position: { x: col1, y: row(2) }, data: { label: nodeLabel("⚙️ /automations", "Dashboard • Test workflows • Audio") }, type: "default", style: { ...frontendStyle, width: 230 } },
    { id: "api", position: { x: col1, y: row(3) }, data: { label: nodeLabel("🔌 API Layer", "/api/n8n • tts • nocodb") }, type: "default", style: { ...frontendStyle, width: 230 } },
    { id: "el", position: { x: col1, y: row(4) }, data: { label: nodeLabel("🔊 Kokoro TTS", "Voice AI (Self-Hosted)") }, type: "default", style: { ...externalStyle, width: 230 } },
    { id: "air", position: { x: col1, y: row(5) }, data: { label: nodeLabel("🗂️ NocoDB", "Candidate CRM") }, type: "default", style: { ...externalStyle, width: 230 } },
    { id: "or", position: { x: col1, y: row(6) }, data: { label: nodeLabel("🧠 OpenRouter", "Llama 3.3 + GPT-4o fallback") }, type: "default", style: { ...externalStyle, width: 230 } },
    { id: "wf1", position: { x: col2, y: row(0) }, data: { label: nodeLabel("WF1 Candidate Intake", "Route by score • Alerts") }, type: "default", style: { ...workflowStyle, width: 230 } },
    { id: "wf2", position: { x: col2, y: row(1) }, data: { label: nodeLabel("WF2 Smart Outreach", "Personalized email + voice") }, type: "default", style: { ...workflowStyle, width: 230 } },
    { id: "wf3", position: { x: col2, y: row(2) }, data: { label: nodeLabel("WF3 Data Sync", "NocoDB push \u2022 Tracker") }, type: "default", style: { ...workflowStyle, width: 230 } },
    { id: "wf4", position: { x: col2, y: row(3) }, data: { label: nodeLabel("WF4 Health Monitor", "Cron every 5 min") }, type: "default", style: { ...workflowStyle, width: 230 } },
    { id: "wf5", position: { x: col2, y: row(4) }, data: { label: nodeLabel("WF5 Pipeline Report", "Weekly analytics") }, type: "default", style: { ...workflowStyle, width: 230 } },
  ];
}

const edges: Edge[] = [
  { id: "e1", source: "pipeline", target: "wf1", label: "POST", animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
  { id: "e2", source: "automations", target: "wf2", label: "POST", animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
  { id: "e3", source: "api", target: "wf3", label: "POST", animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
  { id: "e4", source: "api", target: "wf5", label: "POST", animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
  { id: "e5", source: "api", target: "el", label: "POST", markerEnd: { type: MarkerType.ArrowClosed } },
  { id: "e6", source: "api", target: "air", label: "POST", markerEnd: { type: MarkerType.ArrowClosed } },
  { id: "e7", source: "wf4", target: "health", label: "GET every 5 min", animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
  { id: "e8", source: "wf2", target: "el", markerEnd: { type: MarkerType.ArrowClosed } },
  { id: "e9", source: "wf3", target: "air", markerEnd: { type: MarkerType.ArrowClosed } },
  { id: "e10", source: "wf1", target: "or", markerEnd: { type: MarkerType.ArrowClosed } },
  { id: "e11", source: "wf2", target: "or", markerEnd: { type: MarkerType.ArrowClosed } },
  { id: "e12", source: "wf5", target: "or", markerEnd: { type: MarkerType.ArrowClosed } },
];

function makeEdges(isDark: boolean): Edge[] {
  const edgeColor = isDark ? "#6b7280" : "#9ca3af";
  const labelStyle = { fill: isDark ? "#d1d5db" : "#374151", fontSize: 11, fontWeight: 500 };
  return edges.map(e => ({
    ...e,
    style: { stroke: edgeColor, strokeWidth: 1.5 },
    labelStyle,
    labelBgStyle: { fill: isDark ? "#1a1a2e" : "#f9fafb", fillOpacity: 0.9 },
  }));
}

/* ── Mobile card-based fallback (< 640px) ── */
interface MobileCardProps { title: string; subtitle: string; variant: "frontend" | "workflow" | "external"; isDark: boolean }

function MobileCard({ title, subtitle, variant, isDark }: MobileCardProps) {
  const colors = {
    frontend: isDark
      ? "border-purple-500/40 bg-gradient-to-r from-purple-900/40 to-indigo-900/30 text-purple-200"
      : "border-purple-400/50 bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-900",
    workflow: isDark
      ? "border-teal-500/40 bg-gradient-to-r from-teal-900/40 to-emerald-900/30 text-teal-200"
      : "border-teal-400/50 bg-gradient-to-r from-teal-50 to-emerald-50 text-teal-900",
    external: isDark
      ? "border-amber-500/40 bg-gradient-to-r from-amber-900/40 to-yellow-900/30 text-amber-200"
      : "border-amber-400/50 bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-900",
  };
  return (
    <div className={`rounded-xl border px-4 py-3 ${colors[variant]}`}>
      <div className="font-semibold text-sm">{title}</div>
      <div className="opacity-75 text-xs mt-0.5">{subtitle}</div>
    </div>
  );
}

function MobileArchitecture({ isDark }: { isDark: boolean }) {
  const sectionTitle = (text: string) => (
    <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>{text}</h3>
  );
  const arrow = (
    <div className="flex justify-center py-1.5">
      <svg width="16" height="20" viewBox="0 0 16 20" fill="none" className={isDark ? "text-gray-600" : "text-gray-300"}>
        <path d="M8 0v16M3 12l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
  return (
    <div className="space-y-4">
      <div>
        {sectionTitle("Frontend / API")}
        <div className="grid grid-cols-1 gap-2">
          <MobileCard title="📄 /pipeline" subtitle="Upload → Parse → Score → Questions" variant="frontend" isDark={isDark} />
          <MobileCard title="🩺 /api/health" subtitle="Uptime • AI metrics • Error rates" variant="frontend" isDark={isDark} />
          <MobileCard title="⚙️ /automations" subtitle="Dashboard • Test workflows • Audio" variant="frontend" isDark={isDark} />
          <MobileCard title="🔌 API Layer" subtitle="/api/n8n • tts • nocodb" variant="frontend" isDark={isDark} />
        </div>
      </div>
      {arrow}
      <div>
        {sectionTitle("n8n Workflows")}
        <div className="grid grid-cols-1 gap-2">
          <MobileCard title="WF1 Candidate Intake" subtitle="Route by score • Alerts" variant="workflow" isDark={isDark} />
          <MobileCard title="WF2 Smart Outreach" subtitle="Personalized email + voice" variant="workflow" isDark={isDark} />
          <MobileCard title="WF3 Data Sync" subtitle="NocoDB push \u2022 Tracker" variant="workflow" isDark={isDark} />
          <MobileCard title="WF4 Health Monitor" subtitle="Cron every 5 min" variant="workflow" isDark={isDark} />
          <MobileCard title="WF5 Pipeline Report" subtitle="Weekly analytics" variant="workflow" isDark={isDark} />
        </div>
      </div>
      {arrow}
      <div>
        {sectionTitle("External Services")}
        <div className="grid grid-cols-1 gap-2">
          <MobileCard title="🔊 Kokoro TTS" subtitle="Voice AI (Self-Hosted)" variant="external" isDark={isDark} />
          <MobileCard title="🗂️ NocoDB" subtitle="Candidate CRM" variant="external" isDark={isDark} />
          <MobileCard title="🧠 OpenRouter" subtitle="Llama 3.3 + GPT-4o fallback" variant="external" isDark={isDark} />
        </div>
      </div>
    </div>
  );
}

export default function ArchitectureFlow({ className = "", height = 680 }: ArchitectureFlowProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [layout, setLayout] = useState<LayoutMode>("desktop");

  useEffect(() => {
    function update() {
      const w = window.innerWidth;
      if (w < 640) setLayout("mobile");
      else if (w < 1100) setLayout("tablet");
      else setLayout("desktop");
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const styles = useMemo(() => getStyles(isDark), [isDark]);
  const nodes = useMemo(() => makeNodes(layout, styles), [layout, styles]);
  const themedEdges = useMemo(() => makeEdges(isDark), [isDark]);

  // Mobile: show a clean card-based layout instead of the ReactFlow canvas
  if (layout === "mobile") {
    return (
      <div className={`w-full ${className} p-4 overflow-y-auto`}>
        <MobileArchitecture isDark={isDark} />
      </div>
    );
  }

  // Tablet gets a taller container so the 2-column layout has room
  const effectiveHeight = layout === "tablet" ? Math.max(height, 820) : height;

  return (
    <div className={`w-full ${className}`} style={{ height: effectiveHeight }}>
      <ReactFlow
        nodes={nodes}
        edges={themedEdges}
        defaultEdgeOptions={{ type: "smoothstep" }}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        nodeOrigin={[0, 0]}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        panOnDrag
        zoomOnScroll
        zoomOnPinch
        zoomOnDoubleClick
        minZoom={0.35}
        maxZoom={1.35}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1} color={isDark ? "#333" : "#d1d5db"} />
      </ReactFlow>
    </div>
  );
}
