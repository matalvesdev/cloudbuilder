import { useState, useEffect } from "react";
import {
  Shield,
  Plus,
  Trash2,
  RefreshCw,
  Check,
  X,
  ToggleLeft,
  ToggleRight,
  Globe,
  Key,
  ExternalLink,
  AlertTriangle,
  Eye,
  EyeOff,
  Copy,
  Building2,
  Users,
  Lock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useSsoStore } from "@/store/ssoStore";
import type { SsoProvider, SamlConfig } from "@/types/sso.types";

const ORG_ID = "org-default";

const PROVIDER_LOGOS: Record<string, string> = {
  google: "G",
  github: "GH",
  microsoft: "MS",
  okta: "OK",
  auth0: "A0",
  custom: "SSO",
};
const PROVIDER_COLORS: Record<string, string> = {
  google: "text-blue-400 bg-blue-500/10",
  github: "text-gray-300 bg-gray-700",
  microsoft: "text-blue-500 bg-blue-500/10",
  okta: "text-orange-400 bg-orange-500/10",
  auth0: "text-purple-400 bg-purple-500/10",
  custom: "text-brand-lime bg-brand-lime/10",
};

export default function SSOModule() {
  const {
    providers,
    samlConfig,
    loading,
    error,
    fetchProviders,
    createProvider,
    updateProvider,
    deleteProvider,
    toggleProvider,
    fetchSamlConfig,
    updateSamlConfig,
  } = useSsoStore();

  const [showCreate, setShowCreate] = useState(false);
  const [showSaml, setShowSaml] = useState(false);
  const [pName, setPName] = useState("");
  const [pType, setPType] = useState<SsoProvider["providerType"]>("google");
  const [pClientId, setPClientId] = useState("");
  const [pClientSecret, setPClientSecret] = useState("");
  const [pIssuer, setPIssuer] = useState("");
  const [pDomains, setPDomains] = useState("");
  const [showSecret, setShowSecret] = useState<string | null>(null);

  useEffect(() => {
    fetchProviders(ORG_ID);
    fetchSamlConfig(ORG_ID);
  }, []);

  function handleCreate() {
    if (!pName.trim() || !pClientId.trim()) return;
    createProvider(ORG_ID, {
      name: pName.trim(),
      providerType: pType,
      clientId: pClientId.trim(),
      clientSecret: pClientSecret.trim(),
      issuerUrl: pIssuer.trim() || undefined,
      domains: pDomains
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean),
    });
    setShowCreate(false);
    resetForm();
  }

  function resetForm() {
    setPName("");
    setPType("google");
    setPClientId("");
    setPClientSecret("");
    setPIssuer("");
    setPDomains("");
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">
            SSO / Provedores de Identidade
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Gerencie login único e provedores OAuth/SAML
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowSaml(true)}>
            <Lock className="h-4 w-4 mr-1" /> SAML
          </Button>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1" /> Novo Provedor
          </Button>
        </div>
      </div>

      {error && (
        <Card className="p-4 border-red-800 bg-red-950/20">
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        </Card>
      )}

      {/* Provider Cards */}
      {loading && providers.length === 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : providers.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-gray-700">
          <Shield className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 mb-2">Nenhum provedor SSO configurado</p>
          <p className="text-xs text-gray-600 mb-4">
            Adicione Google, GitHub, Microsoft, Okta ou Auth0
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreate(true)}
          >
            <Plus className="h-4 w-4 mr-1" /> Configurar Provedor
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {providers.map((p) => {
            const logo = PROVIDER_LOGOS[p.providerType] || "?";
            const color =
              PROVIDER_COLORS[p.providerType] || "text-gray-500 bg-gray-800";
            return (
              <Card
                key={p.id}
                className={cn(
                  "p-5 border",
                  p.enabled
                    ? "border-brand-lime/20"
                    : "border-gray-800 opacity-70",
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "h-10 w-10 rounded-lg flex items-center justify-center text-sm font-bold",
                        color,
                      )}
                    >
                      {logo}
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{p.name}</h3>
                      <Badge variant="outline" className="text-xs mt-0.5">
                        {p.providerType}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="h-7 w-7"
                      onClick={() => toggleProvider(p.id, !p.enabled)}
                    >
                      {p.enabled ? (
                        <ToggleRight className="h-4 w-4 text-brand-lime" />
                      ) : (
                        <ToggleLeft className="h-4 w-4 text-gray-600" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="h-7 w-7 text-gray-500 hover:text-red-400"
                      onClick={() => deleteProvider(p.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="mt-3 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Client ID:</span>
                    <span className="text-gray-400 font-mono">
                      {p.clientId.substring(0, 16)}...
                    </span>
                  </div>
                  {p.domains.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Domínios:</span>
                      <span className="text-gray-400">
                        {p.domains.join(", ")}
                      </span>
                    </div>
                  )}
                </div>

                {p.enabled && (
                  <div className="mt-3 pt-3 border-t border-gray-800">
                    <Badge className="bg-green-500/10 text-green-400 text-xs">
                      Ativo
                    </Badge>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Create SSO Provider Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Configurar Provedor SSO</DialogTitle>
            <DialogDescription>
              Configure um provedor de identidade OAuth2/OIDC
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            <div>
              <label className="text-xs text-gray-400">Nome</label>
              <Input
                value={pName}
                onChange={(e) => setPName(e.target.value)}
                placeholder="Google Workspace"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">Provedor</label>
              <select
                className="w-full bg-brand-navy border border-gray-700 rounded px-3 py-2 text-sm text-white"
                value={pType}
                onChange={(e) =>
                  setPType(e.target.value as SsoProvider["providerType"])
                }
              >
                <option value="google">Google</option>
                <option value="github">GitHub</option>
                <option value="microsoft">Microsoft</option>
                <option value="okta">Okta</option>
                <option value="auth0">Auth0</option>
                <option value="custom">Custom (OIDC)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400">Client ID</label>
              <Input
                value={pClientId}
                onChange={(e) => setPClientId(e.target.value)}
                placeholder="123456789.apps.googleusercontent.com"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">Client Secret</label>
              <Input
                value={pClientSecret}
                onChange={(e) => setPClientSecret(e.target.value)}
                type="password"
                placeholder="GOCSPX-..."
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">Issuer URL (OIDC)</label>
              <Input
                value={pIssuer}
                onChange={(e) => setPIssuer(e.target.value)}
                placeholder="https://accounts.google.com"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">
                Domínios permitidos (vírgula)
              </label>
              <Input
                value={pDomains}
                onChange={(e) => setPDomains(e.target.value)}
                placeholder="exemplo.com,outro.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleCreate}
              disabled={!pName.trim() || !pClientId.trim()}
            >
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SAML Config Dialog */}
      <Dialog open={showSaml} onOpenChange={setShowSaml}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Configuração SAML</DialogTitle>
            <DialogDescription>
              Configure provedor SAML para login enterprise
            </DialogDescription>
          </DialogHeader>
          {samlConfig ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400">Entity ID</label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={samlConfig.entityId}
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon-sm"
                    className="h-9 w-9 shrink-0"
                    onClick={() =>
                      navigator.clipboard.writeText(samlConfig.entityId)
                    }
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400">ACS URL</label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={samlConfig.acsUrl}
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon-sm"
                    className="h-9 w-9 shrink-0"
                    onClick={() =>
                      navigator.clipboard.writeText(samlConfig.acsUrl)
                    }
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <Badge
                className={
                  samlConfig.enabled
                    ? "bg-green-500/10 text-green-400"
                    : "bg-gray-800 text-gray-500"
                }
              >
                {samlConfig.enabled ? "SAML Ativo" : "SAML Inativo"}
              </Badge>
            </div>
          ) : (
            <div className="text-center py-8">
              <Lock className="h-10 w-10 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500">SAML não configurado</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() =>
                  updateSamlConfig(ORG_ID, {
                    entityId: `cloudbuilder-${ORG_ID}`,
                    acsUrl: `${window.location.origin}/api/v1/auth/saml/callback`,
                    certificate: "",
                    enabled: true,
                  } as SamlConfig)
                }
              >
                Configurar SAML
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
