import { useState, useEffect, useMemo } from "react";
import {
  BarChart3,
  Users,
  TrendingUp,
  TrendingDown,
  Minimize2,
  Download,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAnalyticsStore } from "@/store/analyticsStore";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

function AnalyticsModule() {
  const [activeTab, setActiveTab] = useState("usage");
  const [period, setPeriod] = useState(30);
  const {
    moduleUsage,
    userActivity,
    featureAdoption,
    fetchModuleUsage,
    fetchUserActivity,
  } = useAnalyticsStore();
  const tenantId = useAuthStore((s) => s.user?.tenantId);

  useEffect(() => {
    if (tenantId) {
      fetchModuleUsage(tenantId);
      fetchUserActivity(tenantId);
    }
  }, [tenantId, period, fetchModuleUsage, fetchUserActivity]);

  const totalEvents = useMemo(
    () => moduleUsage.reduce((s, m) => s + m.events, 0),
    [moduleUsage],
  );

  const maxUsage = useMemo(
    () => Math.max(...moduleUsage.map((m) => m.events), 1),
    [moduleUsage],
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-brand-navy font-display">
              Análises
            </h1>
            <p className="text-sm text-slate-400">
              Métricas de uso da plataforma e adoção de funcionalidades
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setPeriod(d)}
                className={cn(
                  "text-xs h-7 px-3 rounded-md font-medium transition-all",
                  period === d
                    ? "bg-white text-brand-navy shadow-sm"
                    : "text-slate-500 hover:text-brand-navy",
                )}
              >
                {d} dias
              </button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            <Download className="w-3.5 h-3.5" />
            Exportar
          </button>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="bg-slate-100">
          <TabsTrigger value="usage" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Uso por Módulo
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Atividade de Usuários
          </TabsTrigger>
          <TabsTrigger value="adoption" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Adoção de Funcionalidades
          </TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <Card
              title="Total de Eventos"
              value={totalEvents.toLocaleString()}
              icon={BarChart3}
            />
            <Card
              title="Módulos Ativos"
              value={String(moduleUsage.length)}
              icon={BarChart3}
            />
            <Card
              title="Principal Módulo"
              value={moduleUsage[0]?.module ?? "—"}
              icon={TrendingUp}
            />
            <Card
              title="Período"
              value={`Últimos ${period} dias`}
              icon={BarChart3}
            />
          </div>

          <div className="bg-white rounded-3xl card-shadow border border-slate-100 p-6 space-y-5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-lime" />
              <h2 className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                Eventos por Módulo
              </h2>
            </div>

            <div className="space-y-4">
              {moduleUsage.map((item) => {
                const pct = (item.events / maxUsage) * 100;
                return (
                  <div key={item.module} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-brand-navy">
                        {item.module}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-brand-navy">
                          {item.events.toLocaleString()}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {item.percentage}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand-navy transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="bg-white rounded-3xl card-shadow border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-lime" />
                <h2 className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                  Atividade Recente
                </h2>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase">
                      Email
                    </th>
                    <th className="text-right px-5 py-3 text-xs font-bold text-slate-500 uppercase">
                      Sessões
                    </th>
                    <th className="text-right px-5 py-3 text-xs font-bold text-slate-500 uppercase">
                      Ações
                    </th>
                    <th className="text-right px-5 py-3 text-xs font-bold text-slate-500 uppercase">
                      Última Atividade
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {userActivity.map((user) => (
                    <tr
                      key={user.email}
                      className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-5 py-3 text-sm font-medium text-brand-navy">
                        {user.email}
                      </td>
                      <td className="px-5 py-3 text-sm text-slate-600 text-right">
                        {user.sessions}
                      </td>
                      <td className="px-5 py-3 text-sm text-slate-600 text-right">
                        {user.actions}
                      </td>
                      <td className="px-5 py-3 text-sm text-slate-400 text-right">
                        {new Date(user.lastActivity).toLocaleDateString(
                          "pt-BR",
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="adoption" className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <Card title="Média de Adoção" value="43%" icon={TrendingUp} />
            <Card
              title="Funcionalidades"
              value={String(featureAdoption.length)}
              icon={BarChart3}
            />
            <Card
              title="Em Alta"
              value={String(
                featureAdoption.filter((f) => f.trend === "up").length,
              )}
              icon={TrendingUp}
            />
            <Card
              title="Em Queda"
              value={String(
                featureAdoption.filter((f) => f.trend === "down").length,
              )}
              icon={TrendingDown}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {featureAdoption.map((feature) => {
              const TrendIcon =
                feature.trend === "up"
                  ? TrendingUp
                  : feature.trend === "down"
                    ? TrendingDown
                    : Minimize2;
              const trendColor =
                feature.trend === "up"
                  ? "text-green-600 bg-green-100"
                  : feature.trend === "down"
                    ? "text-red-600 bg-red-100"
                    : "text-slate-500 bg-slate-100";
              const barColor =
                feature.adoptionRate > 60
                  ? "bg-green-500"
                  : feature.adoptionRate > 30
                    ? "bg-amber-500"
                    : "bg-red-500";

              return (
                <div
                  key={feature.feature}
                  className="rounded-2xl border border-slate-100 bg-white card-shadow p-5 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-brand-navy">
                      {feature.feature}
                    </h3>
                    <div
                      className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center",
                        trendColor,
                      )}
                    >
                      <TrendIcon className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-3xl font-bold text-brand-navy">
                        {feature.adoptionRate}%
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {feature.users} usuários
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs font-medium",
                        feature.trend === "up"
                          ? "text-green-700 border-green-200 bg-green-50"
                          : feature.trend === "down"
                            ? "text-red-700 border-red-200 bg-red-50"
                            : "text-slate-500 border-slate-200",
                      )}
                    >
                      {feature.trend === "up"
                        ? "+"
                        : feature.trend === "down"
                          ? "-"
                          : ""}
                      {feature.trend === "up"
                        ? "Em alta"
                        : feature.trend === "down"
                          ? "Em queda"
                          : "Estável"}
                    </Badge>
                  </div>

                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        barColor,
                      )}
                      style={{ width: `${feature.adoptionRate}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AnalyticsModule;
export { AnalyticsModule };
