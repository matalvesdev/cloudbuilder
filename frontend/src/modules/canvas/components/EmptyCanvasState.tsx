import {
  Box,
  LayoutGrid,
  Network,
  Database,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useCanvasStore } from "@/store/canvasStore";
import { allComponents } from "./properties/providerDefinitions";
import { cn } from "@/lib/utils";

interface Template {
  key: string;
  title: string;
  description: string;
  icon: typeof Box;
  components: string[];
  color: string;
}

const TEMPLATES: Template[] = [
  {
    key: "vpc-basico",
    title: "VPC Básica",
    description: "VPC, Subnets, IGW e Route Table",
    icon: Network,
    components: ["aws-vpc", "aws-subnet", "aws-subnet", "aws-igw", "aws-rtb"],
    color: "text-orange-600",
  },
  {
    key: "web-app-3-tier",
    title: "Web App 3 Camadas",
    description: "ALB → EC2 → RDS com SG e S3",
    icon: LayoutGrid,
    components: [
      "aws-vpc",
      "aws-subnet",
      "aws-subnet",
      "aws-alb",
      "aws-ec2",
      "aws-sg",
      "aws-rds",
      "aws-s3",
    ],
    color: "text-sky-600",
  },
  {
    key: "serverless-api",
    title: "API Serverless",
    description: "Lambda + DynamoDB + SQS + SNS",
    icon: Sparkles,
    components: ["aws-lambda", "aws-dynamodb", "aws-sqs", "aws-sns", "aws-s3"],
    color: "text-purple-600",
  },
  {
    key: "banco-rds",
    title: "Banco Gerenciado",
    description: "RDS Multi-AZ com ElastiCache",
    icon: Database,
    components: [
      "aws-vpc",
      "aws-subnet",
      "aws-subnet",
      "aws-rds",
      "aws-elasticache",
      "aws-sg",
    ],
    color: "text-emerald-600",
  },
];

export function EmptyCanvasState() {
  const addNode = useCanvasStore((s) => s.addNode);
  const autoLayout = useCanvasStore((s) => s.autoLayout);
  const addEdgeWithType = useCanvasStore((s) => s.addEdgeWithType);
  const nodes = useCanvasStore((s) => s.nodes);

  if (nodes.length > 0) return null;

  const loadTemplate = async (template: Template) => {
    const nodeIds: string[] = [];
    for (const compId of template.components) {
      const comp = allComponents.find((c) => c.id === compId);
      if (!comp) continue;
      addNode(comp, {
        x: 150 + Math.random() * 400,
        y: 100 + Math.random() * 300,
      });
      const state = useCanvasStore.getState();
      const newNode = state.nodes[state.nodes.length - 1];
      if (newNode) nodeIds.push(newNode.id);
    }
    await new Promise((r) => setTimeout(r, 100));
    await autoLayout();
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
      <div className="pointer-events-auto max-w-xl w-full mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-lime/20 mb-4">
            <LayoutGrid className="w-7 h-7 text-brand-navy" />
          </div>
          <h2 className="text-xl font-bold text-brand-navy mb-2 font-display">
            Canvas vazio
          </h2>
          <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            Arraste componentes da paleta ao lado ou escolha um template para
            começar.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {TEMPLATES.map((template) => {
            const Icon = template.icon;
            return (
              <button
                key={template.key}
                onClick={() => loadTemplate(template)}
                className={cn(
                  "group flex flex-col items-start gap-2 p-4 bg-white border border-slate-200 rounded-xl shadow-sm",
                  "hover:border-brand-navy hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left",
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                    <Icon className={cn("w-4 h-4", template.color)} />
                  </div>
                  <span className="font-bold text-sm text-brand-navy">
                    {template.title}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed min-h-[2.5em]">
                  {template.description}
                </p>
                <div className="flex items-center gap-1 text-[10px] font-bold text-brand-lime opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider">
                  Criar <ArrowRight className="w-3 h-3" />
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-400">
            Ou use{" "}
            <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-mono text-slate-500 border border-slate-200">
              ⌘K
            </kbd>{" "}
            para paleta de comandos
          </p>
        </div>
      </div>
    </div>
  );
}
