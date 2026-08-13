import { useState, useMemo } from "react";
import { Copy, ChevronDown, ChevronUp, FileCode } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCanvasStore } from "@/store/canvasStore";
import { generateTerraformCode } from "../services/terraformCodegen";
import type { CodeTab } from "../services/terraformCodegen";
import { cn } from "@/lib/utils";

function highlightLine(line: string): React.ReactNode {
  const trimmed = line.trim();
  if (
    trimmed.startsWith('resource "') ||
    trimmed.startsWith('variable "') ||
    trimmed.startsWith('output "') ||
    trimmed.startsWith('provider "')
  ) {
    const match = trimmed.match(
      /^(resource|variable|output|provider)\s+"([^"]+)"\s+"([^"]+)"/,
    );
    if (match) {
      const [, keyword, type, name] = match;
      const before = line.slice(0, line.indexOf(keyword));
      const after = line.slice(
        line.indexOf('"', line.indexOf(name) + name.length + 2) + 1,
      );
      return (
        <>
          {before}
          <span className="text-blue-500 font-semibold">{keyword}</span>{" "}
          <span className="text-green-600">"{type}"</span>{" "}
          <span className="text-purple-500">"{name}"</span>
          {after}
        </>
      );
    }
    const match2 = trimmed.match(
      /^(resource|variable|output|provider)\s+"([^"]+)"/,
    );
    if (match2) {
      const [, keyword, name] = match2;
      const before = line.slice(0, line.indexOf(keyword));
      const after = line.slice(
        line.indexOf('"', line.indexOf(name) + name.length + 2) + 1,
      );
      return (
        <>
          {before}
          <span className="text-blue-500 font-semibold">{keyword}</span>{" "}
          <span className="text-green-600">"{name}"</span>
          {after}
        </>
      );
    }
  }
  const eqMatch = trimmed.match(/^(\w[\w_]*)\s*=\s*(.*)/);
  if (eqMatch) {
    const before = line.slice(0, line.indexOf(eqMatch[1]));
    const val = eqMatch[2].trim();
    if (val.startsWith('"')) {
      return (
        <>
          {before}
          <span className="text-slate-700 font-medium">
            {eqMatch[1]}
          </span> = <span className="text-green-600">{val}</span>
        </>
      );
    }
    if (/^\d/.test(val)) {
      return (
        <>
          {before}
          <span className="text-slate-700 font-medium">
            {eqMatch[1]}
          </span> = <span className="text-amber-600">{val}</span>
        </>
      );
    }
    if (
      val.startsWith("aws_") ||
      val.startsWith("azurerm_") ||
      val.startsWith("google_")
    ) {
      return (
        <>
          {before}
          <span className="text-slate-700 font-medium">
            {eqMatch[1]}
          </span> = <span className="text-red-500">{val}</span>
        </>
      );
    }
    return (
      <>
        {before}
        <span className="text-slate-700 font-medium">{eqMatch[1]}</span> ={" "}
        <span className="text-slate-500">{val}</span>
      </>
    );
  }
  // Highlight provider blocks
  const provMatch = trimmed.match(/^provider\s+"([^"]+)"/);
  if (provMatch) {
    const before = line.slice(0, line.indexOf("provider"));
    return (
      <>
        {before}
        <span className="text-blue-500 font-semibold">provider</span>{" "}
        <span className="text-green-600">"{provMatch[1]}"</span>
      </>
    );
  }
  return <>{line}</>;
}

export function CodePreviewPanel({
  expanded,
  onToggle,
}: {
  expanded: boolean;
  onToggle?: () => void;
}) {
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const [copied, setCopied] = useState(false);

  const [activeTab, setActiveTab] = useState("main.tf");

  const codeTabs = useMemo(() => {
    const tabs = generateTerraformCode(nodes, edges);
    // Reset active tab if current one no longer exists
    const tabIds = tabs.map((t) => t.id);
    if (!tabIds.includes(activeTab) && tabs.length > 0) {
      setActiveTab(tabs[0].id);
    }
    return tabs;
  }, [nodes, edges, activeTab]);

  const activeCode = codeTabs.find((t) => t.id === activeTab);

  const handleCopy = () => {
    if (!activeCode) return;
    navigator.clipboard.writeText(activeCode.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "bg-white border-t border-slate-200 flex flex-col shrink-0 transition-all duration-300",
        expanded ? "h-72" : "h-10",
      )}
    >
      {/* Tab Bar */}
      <div
        className={cn(
          "h-10 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0",
          expanded ? "" : "cursor-pointer",
        )}
        onClick={() => !expanded && onToggle?.()}
      >
        <div className="flex items-center gap-4 h-full">
          {codeTabs.length > 0 ? (
            codeTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={(e) => {
                  e.stopPropagation();
                  if (expanded) setActiveTab(tab.id);
                }}
                className={cn(
                  "font-mono text-xs font-bold h-full flex items-center px-1 border-b-2 transition-colors whitespace-nowrap",
                  activeTab === tab.id && expanded
                    ? "border-brand-navy text-brand-navy"
                    : "border-transparent text-slate-500 hover:text-brand-navy",
                )}
              >
                {tab.name}
              </button>
            ))
          ) : (
            <span className="font-mono text-xs text-slate-400">
              Nenhum recurso no canvas
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
            {nodes.length > 0 ? "Gerado do Canvas" : "Vazio"}
          </span>
          <div className="h-4 w-px bg-slate-200" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCopy();
            }}
            className="text-slate-500 hover:text-brand-navy transition-colors flex items-center gap-1 text-xs font-medium"
          >
            <Copy className="w-3.5 h-3.5" />
            {copied ? "Copiado!" : "Copiar"}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle?.();
            }}
            className="text-slate-400 hover:text-brand-navy transition-colors"
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Code Content */}
      {expanded && activeCode && (
        <ScrollArea className="flex-1 bg-slate-50/50">
          <div className="p-6 font-mono text-sm leading-loose">
            <pre className="space-y-0">
              {activeCode.content.split("\n").map((line, i) => (
                <div key={i} className="flex">
                  <span className="w-8 select-none text-right mr-4 text-slate-300 text-xs">
                    {i + 1}
                  </span>
                  <span className="text-slate-600">{highlightLine(line)}</span>
                </div>
              ))}
            </pre>
          </div>
        </ScrollArea>
      )}

      {expanded && !activeCode && nodes.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-sm text-slate-400 bg-slate-50/50">
          <div className="text-center space-y-2">
            <FileCode className="w-8 h-8 mx-auto text-slate-300" />
            <p>Adicione recursos ao canvas para gerar código Terraform</p>
          </div>
        </div>
      )}
    </div>
  );
}
