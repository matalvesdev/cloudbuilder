import { useState } from 'react'
import {
  Clock,
  ShieldCheck,
  Code2,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AuditTimelineView } from './AuditTimelineView'
import { ComplianceDashboardView } from './ComplianceDashboardView'
import { RegoPolicyView } from './RegoPolicyView'

export function AuditModule() {
  const [activeTab, setActiveTab] = useState('timeline')

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-navy font-display">Auditoria & Conformidade</h1>
        <p className="text-sm text-slate-400">Trilha de auditoria, regras e score de conformidade</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="timeline" className="gap-2">
            <Clock className="h-4 w-4" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="compliance" className="gap-2">
            <ShieldCheck className="h-4 w-4" />
            Conformidade
          </TabsTrigger>
          <TabsTrigger value="rego" className="gap-2">
            <Code2 className="h-4 w-4" />
            Políticas OPA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timeline">
          <AuditTimelineView />
        </TabsContent>

        <TabsContent value="compliance">
          <ComplianceDashboardView />
        </TabsContent>

        <TabsContent value="rego">
          <RegoPolicyView />
        </TabsContent>
      </Tabs>
    </div>
  )
}
