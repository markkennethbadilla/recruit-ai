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

function makeNodes(compact: boolean, styles: ReturnType<typeof getStyles>): Node[] {
  const { frontendStyle, workflowStyle, externalStyle } = styles;
  const col1 = compact ? 40 : 40;
  const col2 = compact ? 40 : 470;
  const col3 = compact ? 40 : 900;
  const row = (index: number) => (compact ? 120 + index * 120 : 90 + index * 110);

  return [
    { id: "pipeline", position: { x: col1, y: row(0) }, data: { label: nodeLabel("📄 /pipeline", "Upload → Parse → Score → Questions") }, type: "default", style: frontendStyle },
    { id: "health", position: { x: col1, y: row(1) }, data: { label: nodeLabel("🩺 /api/health", "Uptime • AI metrics • Error rates") }, type: "default", style: frontendStyle },
    { id: "automations", position: { x: col1, y: row(2) }, data: { label: nodeLabel("⚙️ /automations", "Dashboard • Test workflows • Audio") }, type: "default", style: frontendStyle },
    { id: "api", position: { x: col1, y: row(3) }, data: { label: nodeLabel("🔌 API Layer", "/api/n8n/sync • outreach • report\n/api/elevenlabs/tts • /api/airtable") }, type: "default", style: frontendStyle },

    { id: "wf1", position: { x: col2, y: row(0) }, data: { label: nodeLabel("WF1 Candidate Intake", "Route by score • Alerts") }, type: "default", style: workflowStyle },
    { id: "wf2", position: { x: col2, y: row(1) }, data: { label: nodeLabel("WF2 Smart Outreach", "Personalized email + voice") }, type: "default", style: workflowStyle },
    { id: "wf3", position: { x: col2, y: row(2) }, data: { label: nodeLabel("WF3 Data Sync", "AirTable push • Tracker") }, type: "default", style: workflowStyle },
    { id: "wf4", position: { x: col2, y: row(3) }, data: { label: nodeLabel("WF4 Health Monitor", "Cron every 5 min") }, type: "default", style: workflowStyle },
    { id: "wf5", position: { x: col2, y: row(4) }, data: { label: nodeLabel("WF5 Pipeline Report", "Weekly analytics") }, type: "default", style: workflowStyle },

    { id: "el", position: { x: col3, y: row(0) }, data: { label: nodeLabel("🔊 ElevenLabs", "Voice AI (TTS)") }, type: "default", style: externalStyle },
    { id: "air", position: { x: col3, y: row(1) }, data: { label: nodeLabel("🗂️ AirTable", "Candidate CRM") }, type: "default", style: externalStyle },
    { id: "or", position: { x: col3, y: row(2) }, data: { label: nodeLabel("🧠 OpenRouter", "Llama 3.3 + GPT-4o fallback") }, type: "default", style: externalStyle },
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

export default function ArchitectureFlow({ className = "", height = 680 }: ArchitectureFlowProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    function update() {
      setCompact(window.innerWidth < 1100);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const styles = useMemo(() => getStyles(isDark), [isDark]);
  const nodes = useMemo(() => makeNodes(compact, styles), [compact, styles]);
  const themedEdges = useMemo(() => makeEdges(isDark), [isDark]);

  return (
    <div className={`w-full ${className}`} style={{ height }}>
      <ReactFlow
        nodes={nodes}
        edges={themedEdges}
        defaultEdgeOptions={{ type: "smoothstep" }}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodeOrigin={[0, 0]}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        panOnDrag
        zoomOnScroll
        zoomOnPinch
        zoomOnDoubleClick
        minZoom={0.45}
        maxZoom={1.35}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1} color={isDark ? "#333" : "#d1d5db"} />
      </ReactFlow>
    </div>
  );
}
