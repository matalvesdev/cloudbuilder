import { CheckCircle2, XCircle, Loader2, Box, RefreshCw, GitBranch, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { APP_TYPE_LABELS, DEPLOY_TARGET_LABELS, DEPLOY_STATUS_LABELS, CI_PROVIDER_LABELS } from '@/types/deploy.types'
import type { AppDeployment } from '@/types/deploy.types'
import type { ConnectedRepo } from '@/types/repo.types'

interface AppDeploymentsSectionProps {
  appDeploymentsForEnv: AppDeployment[]
  reposWithApp: ConnectedRepo[]
  connectedRepos: ConnectedRepo[]
  onRefresh: () => void
  onDeployApp: () => void
}

export function AppDeploymentsSection({
  appDeploymentsForEnv,
  reposWithApp,
  connectedRepos,
  onRefresh,
  onDeployApp,
}: AppDeploymentsSectionProps) {
  return (
    <div className="mt-6 bg-white border border-slate-200 rounded-xl p-5 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-navy/10 flex items-center justify-center">
            <Box className="w-4 h-4 text-brand-navy" />
          </div>
          <div>
            <h3 className="text-[12px] font-bold uppercase tracking-wide text-slate-400">Deploy de Aplicação</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Implante aplicações dos repositórios conectados na infraestrutura
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {appDeploymentsForEnv.length > 0 && (
            <button
              onClick={onRefresh}
              className="inline-flex items-center gap-1 px-3 h-8 rounded-full text-[10px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all"
            >
              <RefreshCw className="w-3 h-3" />
              Atualizar
            </button>
          )}
          <button
            onClick={onDeployApp}
            disabled={reposWithApp.length === 0}
            className="inline-flex items-center gap-1.5 px-4 h-8 rounded-full text-[11px] font-semibold bg-brand-navy text-white hover:bg-[#0D1B2A] transition-all disabled:opacity-50"
          >
            <Box className="w-3.5 h-3.5" />
            Deploy App
          </button>
        </div>
      </div>

      {reposWithApp.length === 0 && appDeploymentsForEnv.length === 0 && (
        <div className="py-6 text-center">
          <Box className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-400">
            Nenhum repositório com aplicação detectada. Conecte um repositório no módulo Platform.
          </p>
        </div>
      )}

      {appDeploymentsForEnv.length === 0 && reposWithApp.length > 0 && (
        <div className="py-6 text-center">
          <p className="text-xs text-slate-400 mb-2">
            {reposWithApp.length} {reposWithApp.length === 1 ? 'repositório disponível' : 'repositórios disponíveis'} com aplicação
          </p>
          <p className="text-[10px] text-slate-400">
            Clique em "Deploy App" para implantar uma aplicação neste ambiente
          </p>
        </div>
      )}

      {appDeploymentsForEnv.length > 0 && (
        <div className="space-y-3">
          {appDeploymentsForEnv.map((dep) => {
            const repo = connectedRepos.find((r) => r.id === dep.repoId)
            return (
              <div key={dep.id} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold',
                      dep.status === 'success' ? 'bg-green-500' :
                      dep.status === 'deploying' || dep.status === 'running' ? 'bg-blue-500' :
                      dep.status === 'failed' ? 'bg-red-500' :
                      'bg-slate-400'
                    )}>
                      <Box className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-brand-navy">{dep.appName}</span>
                        <span className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border',
                          dep.status === 'success' ? 'bg-green-50 text-green-600 border-green-200' :
                          dep.status === 'deploying' || dep.status === 'running' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                          dep.status === 'failed' ? 'bg-red-50 text-red-600 border-red-200' :
                          'bg-slate-50 text-slate-600 border-slate-200'
                        )}>
                          {dep.status === 'success' ? <CheckCircle2 className="w-2.5 h-2.5" /> :
                           dep.status === 'deploying' || dep.status === 'running' ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> :
                           <XCircle className="w-2.5 h-2.5" />}
                          {DEPLOY_STATUS_LABELS[dep.status]}
                        </span>
                        {dep.appType && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-ice-blue text-brand-navy border border-ice-blue">
                            {APP_TYPE_LABELS[dep.appType as keyof typeof APP_TYPE_LABELS] || dep.appType}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        {repo && (
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <GitBranch className="w-2.5 h-2.5" />
                            {repo.fullName}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">{DEPLOY_TARGET_LABELS[dep.targetType]}</span>
                        <span className="text-[10px] text-slate-400">{dep.version}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {dep.ciProvider && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                        {CI_PROVIDER_LABELS[dep.ciProvider]}
                      </span>
                    )}
                  </div>
                </div>

                {dep.url && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border',
                      dep.healthStatus === 'healthy' ? 'bg-green-50 text-green-700 border-green-200' :
                      dep.healthStatus === 'degraded' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      dep.healthStatus === 'down' ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-slate-50 text-slate-500 border-slate-200'
                    )}>
                      <span className="relative flex h-1.5 w-1.5">
                        <span className={cn(
                          'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                          dep.healthStatus === 'healthy' ? 'bg-green-400' :
                          dep.healthStatus === 'degraded' ? 'bg-amber-400' :
                          'bg-red-400'
                        )} />
                        <span className={cn(
                          'relative inline-flex rounded-full h-1.5 w-1.5',
                          dep.healthStatus === 'healthy' ? 'bg-green-500' :
                          dep.healthStatus === 'degraded' ? 'bg-amber-500' :
                          dep.healthStatus === 'down' ? 'bg-red-500' :
                          'bg-slate-400'
                        )} />
                      </span>
                      {dep.healthStatus === 'healthy' ? 'Saudável' :
                       dep.healthStatus === 'degraded' ? 'Degradado' :
                       dep.healthStatus === 'down' ? 'Fora do Ar' :
                       'Desconhecido'}
                    </span>
                    <a
                      href={dep.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium text-brand-navy bg-ice-blue hover:bg-ice-blue/80 transition-all border border-ice-blue"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {dep.url}
                    </a>
                  </div>
                )}

                {dep.deployedAt && (
                  <p className="text-[10px] text-slate-400 mt-2">
                    Último deploy: {new Date(dep.deployedAt).toLocaleString('pt-BR')}
                    {dep.lastHealthCheck && ` · Último health check: ${new Date(dep.lastHealthCheck).toLocaleString('pt-BR')}`}
                  </p>
                )}

                {dep.pipelineYaml && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Pipeline</span>
                      <span className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-bold border',
                        dep.status === 'success' ? 'bg-green-50 text-green-600 border-green-200' :
                        dep.status === 'running' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                        'bg-slate-50 text-slate-600 border-slate-200'
                      )}>
                        {dep.status === 'success' ? 'Configurado' : dep.status === 'running' ? 'Executando' : 'Pendente'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
