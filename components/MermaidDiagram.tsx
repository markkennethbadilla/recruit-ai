"use client";

import { useEffect, useRef, useState } from "react";

interface MermaidDiagramProps {
  chart: string;
  className?: string;
}

export default function MermaidDiagram({ chart, className = "" }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          themeVariables: {
            primaryColor: "#7c3aed",
            primaryTextColor: "#e2e8f0",
            primaryBorderColor: "#6d28d9",
            lineColor: "#6d28d9",
            secondaryColor: "#1e293b",
            tertiaryColor: "#0f172a",
            background: "#0f172a",
            mainBkg: "#1e293b",
            nodeBorder: "#6d28d9",
            clusterBkg: "#1e1b4b22",
            clusterBorder: "#4c1d9544",
            titleColor: "#c4b5fd",
            edgeLabelBackground: "#1e293b",
            nodeTextColor: "#e2e8f0",
          },
          flowchart: {
            htmlLabels: true,
            curve: "linear",
            padding: 28,
            nodeSpacing: 50,
            rankSpacing: 80,
            useMaxWidth: false,
          },
          securityLevel: "loose",
        });

        const id = `mermaid-${Date.now()}`;
        const { svg: rendered } = await mermaid.render(id, chart);
        if (!cancelled) setSvg(rendered);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Diagram render failed");
      }
    }

    render();
    return () => { cancelled = true; };
  }, [chart]);

  if (error) {
    return (
      <div className={`p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm ${className}`}>
        Diagram error: {error}
      </div>
    );
  }

  if (!svg) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-auto [&_svg]:max-w-none [&_svg]:h-auto [&_svg]:min-w-[980px] ${className}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
