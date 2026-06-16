import { useState } from 'react'
import {
  PlayCircle, CheckCircle2, XCircle, Clock, Terminal, Plus, Minus, Pencil,
  Copy, Download, ChevronRight, Delete, ArrowUpFromLine, PanelBottomClose,
  PanelBottomOpen, Settings, LayoutDashboard, LogOut, Diff,
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface ResourceChange {
  id: string
  name: string
  address: string
  type: 'added' | 'modified' | 'destroyed'
}

const resourceChanges: ResourceChange[] = [
  { id: '1', name: 'aws_instance.web_server', address: 'module.vpc.aws_instance.main', type: 'added' },
  { id: '2', name: 'aws_security_group.allow_tls', address: 'module.security.aws_sg.main', type: 'added' },
  { id: '3', name: 'aws_s3_bucket.logs', address: 'module.storage.s3_bucket', type: 'modified' },
  { id: '4', name: 'aws_lb_target_group.front_end', address: 'module.lb.tg', type: 'modified' },
]

const terminalLines = [
  { line: 1, text: 'Terraform foi inicializado com sucesso!', color: 'text-slate-400' },
  { line: 2, text: '', color: 'text-slate-400' },
  { line: 3, text: 'Terraform usou os provedores selecionados para gerar o seguinte plano de execução. As ações são indicadas com os seguintes símbolos:', color: 'text-slate-600' },
  { line: 4, text: '  + criar', color: 'text-green-500 font-medium' },
  { line: 5, text: '  ~ atualizar no local', color: 'text-blue-500 font-medium' },
  { line: 6, text: '', color: 'text-slate-400' },
  { line: 7, text: 'O Terraform executará as seguintes ações:', color: 'text-slate-600' },
  { line: 8, text: '', color: 'text-slate-400' },
  { line: 9, text: '  # aws_instance.web_server será criado', color: 'text-slate-700' },
  { line: 10, text: '  + resource "aws_instance" "web_server" {', color: 'text-slate-500' },
  { line: 11, text: '  + ami                          = "ami-0c55b159cbfafe1f0"', color: 'text-slate-500' },
  { line: 12, text: '  + instance_type                = "t2.micro"', color: 'text-slate-500' },
  { line: 13, text: '  + availability_zone            = (conhecido após aplicar)', color: 'text-slate-500' },
  { line: 14, text: '  + key_name                     = "production-key"', color: 'text-slate-500' },
  { line: 15, text: '    }', color: 'text-slate-500' },
  { line: 16, text: '', color: 'text-slate-400' },
  { line: 17, text: '  # aws_s3_bucket.logs será atualizado no local', color: 'text-slate-700' },
  { line: 18, text: '  ~ resource "aws_s3_bucket" "logs" {', color: 'text-slate-500' },
  { line: 19, text: '        id            = "prod-logs-bucket"', color: 'text-slate-500' },
  { line: 20, text: '  ~ tags          = {', color: 'text-slate-500' },
  { line: 21, text: '  + "Environment" = "Production"', color: 'text-slate-500' },
  { line: 22, text: '        }', color: 'text-slate-500' },
  { line: 23, text: '    }', color: 'text-slate-500' },
  { line: 24, text: '', color: 'text-slate-400' },
  { line: 25, text: 'Plano: 12 para adicionar, 4 para alterar, 0 para destruir.', color: 'text-primary font-bold', highlight: true },
]

const ResourceIcon = ({ type }: { type: 'added' | 'modified' | 'destroyed' }) => {
  if (type === 'added') return <Plus className="w-3.5 h-3.5 text-green-500" />
  if (type === 'modified') return <Pencil className="w-3.5 h-3.5 text-blue-500" />
  return <Minus className="w-3.5 h-3.5 text-slate-400" />
}

const resourceColor = {
  added: 'border-green-100 hover:border-green-200',
  modified: 'border-blue-100 hover:border-blue-200',
  destroyed: 'border-slate-100 hover:border-slate-200',
}

export function TerraformExecutor() {
  const [showCodePanel, setShowCodePanel] = useState(true)

  return (
    <div className="flex-1 flex flex-col min-w-0 max-h-screen">
      {/* Top Header */}
      <div className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-navy flex items-center justify-center shadow-md">
              <Terminal className="w-4 h-4 text-brand-lime" />
            </div>
            <span className="font-display font-bold text-lg text-brand-navy">CloudBuilder</span>
          </div>
          <div className="h-6 w-px bg-slate-200 mx-2" />
          <nav className="flex items-center gap-1.5 text-sm text-slate-500">
            <span className="hover:text-brand-navy cursor-pointer transition-colors">Projetos</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="hover:text-brand-navy cursor-pointer transition-colors">vpc-producao</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-brand-navy font-semibold bg-slate-50 px-2 py-0.5 rounded border border-slate-100">Executor do Terraform</span>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200">
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(132,204,22,0.6)] animate-pulse" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Workspace Ativo</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-brand-navy text-white flex items-center justify-center shadow-md">
            <span className="text-xs font-bold">DL</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-20 flex flex-col items-center py-6 gap-6 bg-white border-r border-slate-100 shrink-0">
          <button className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-brand-navy hover:bg-slate-50 transition-all group relative">
            <LayoutDashboard className="w-5 h-5" />
            <span className="absolute left-14 bg-brand-navy text-white text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap font-medium z-50">Dashboard</span>
          </button>
          <button className="w-10 h-10 rounded-xl flex items-center justify-center text-white bg-brand-navy shadow-lg transition-all relative">
            <Terminal className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-brand-navy hover:bg-slate-50 transition-all group relative">
            <Diff className="w-5 h-5" />
            <span className="absolute left-14 bg-brand-navy text-white text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap font-medium z-50">State Diff</span>
          </button>
          <button className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-brand-navy hover:bg-slate-50 transition-all group relative">
            <Settings className="w-5 h-5" />
            <span className="absolute left-14 bg-brand-navy text-white text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap font-medium z-50">Configurações</span>
          </button>
          <div className="mt-auto">
            <button className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all group relative">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Title & Actions Bar */}
          <div className="h-28 px-8 flex items-center justify-between shrink-0 border-b border-slate-50">
            <div className="flex items-start gap-4">
              <div className="hidden xl:flex flex-col items-start gap-1 p-2 bg-white border border-slate-200 rounded shadow-sm w-32 shrink-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">RUN ID: #4092</span>
                <div className="h-6 w-full" style={{
                  backgroundImage: 'linear-gradient(90deg, #0a1128 0%, #0a1128 4%, transparent 4%, transparent 6%, #0a1128 6%, #0a1128 8%, transparent 8%, transparent 9%, #0a1128 9%, #0a1128 14%, transparent 14%, transparent 16%, #0a1128 16%, #0a1128 20%, transparent 20%, transparent 24%, #0a1128 24%, #0a1128 26%, transparent 26%, transparent 28%, #0a1128 28%, #0a1128 32%, transparent 32%, transparent 34%, #0a1128 34%, #0a1128 40%, transparent 40%, transparent 45%, #0a1128 45%, #0a1128 55%, transparent 55%, transparent 60%, #0a1128 60%, #0a1128 65%)',
                  opacity: 0.8,
                }} />
                <span className="text-[10px] font-mono text-slate-500 mt-1">DEZ 15, 2025</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-brand-navy font-display tracking-tight flex items-center gap-3">
                  Executor do Terraform
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">v1.5.7</span>
                </h1>
                <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                  Última execução há 2 min por <span className="font-semibold text-brand-navy">@devops_lead</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 px-5 py-2.5 rounded-xl bg-white border border-slate-200 shadow-sm">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">Status</span>
                <span className="w-px h-4 bg-slate-200" />
                <span className="text-green-600 font-mono text-sm font-bold bg-green-50 px-2 py-0.5 rounded border border-green-100">VALIDADO</span>
              </div>
              <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
                <button className="group px-4 py-2 rounded-lg border border-brand-navy/20 text-brand-navy hover:bg-slate-50 transition-all flex items-center gap-2 font-medium">
                  <PlayCircle className="w-4 h-4" />
                  Planejar
                </button>
                <button className="group px-6 py-2 rounded-lg bg-brand-navy text-white font-semibold shadow-lg hover:bg-brand-navy/90 transition-all flex items-center gap-2">
                  Aplicar
                  <ArrowUpFromLine className="w-4 h-4" />
                </button>
              </div>
              <button className="w-10 h-10 rounded-lg border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all flex items-center justify-center" title="Destruir Infraestrutura">
                <Delete className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content: Resource Summary + Terminal */}
          <div className="flex-1 flex gap-6 px-8 pb-8 min-h-0 pt-6">
            {/* Left Column: Summary + Resource Changes */}
            <div className="w-1/3 flex flex-col gap-5 min-w-[360px]">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4 shrink-0">
                <div className="bg-white p-4 rounded-xl card-shadow border border-slate-100 flex flex-col justify-between h-28 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-green-500" />
                  <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-green-500/10 rounded-full group-hover:scale-150 transition-transform duration-500" />
                  <div className="z-10">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Para Adicionar</span>
                  </div>
                  <div className="flex items-center justify-between z-10">
                    <span className="text-3xl font-bold text-green-600 font-display">12</span>
                    <Plus className="w-5 h-5 text-green-500" />
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl card-shadow border border-slate-100 flex flex-col justify-between h-28 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-blue-500" />
                  <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-blue-500/10 rounded-full group-hover:scale-150 transition-transform duration-500" />
                  <div className="z-10">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Para Alterar</span>
                  </div>
                  <div className="flex items-center justify-between z-10">
                    <span className="text-3xl font-bold text-blue-600 font-display">4</span>
                    <Pencil className="w-5 h-5 text-blue-500" />
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl card-shadow border border-slate-100 flex flex-col justify-between h-28 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-slate-200" />
                  <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-slate-100 rounded-full group-hover:scale-150 transition-transform duration-500" />
                  <div className="z-10">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Para Destruir</span>
                  </div>
                  <div className="flex items-center justify-between z-10">
                    <span className="text-3xl font-bold text-slate-300 font-display">0</span>
                    <Minus className="w-5 h-5 text-slate-300" />
                  </div>
                </div>
              </div>

              {/* Resource Changes List */}
              <div className="flex-1 bg-white rounded-xl card-shadow border border-slate-100 flex flex-col overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="font-bold text-brand-navy text-sm tracking-wide">Alterações de Recursos</h3>
                  <span className="px-2 py-1 bg-white rounded border border-slate-200 text-xs font-mono text-slate-500 shadow-sm">16 recursos</span>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-3 space-y-1.5">
                    {resourceChanges.map((r) => (
                      <div
                        key={r.id}
                        className={cn(
                          'p-3 rounded-lg bg-white border cursor-pointer group flex items-start gap-4 transition-all hover:shadow-md',
                          resourceColor[r.type]
                        )}
                      >
                        <div className={cn(
                          'mt-0.5 w-6 h-6 rounded-md flex items-center justify-center text-sm font-bold border shrink-0',
                          r.type === 'added' && 'bg-green-50 text-green-600 border-green-200',
                          r.type === 'modified' && 'bg-blue-50 text-blue-600 border-blue-200',
                          r.type === 'destroyed' && 'bg-slate-50 text-slate-400 border-slate-200',
                        )}>
                          {r.type === 'added' && '+'}
                          {r.type === 'modified' && '~'}
                          {r.type === 'destroyed' && '-'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-700 truncate group-hover:text-brand-navy transition-colors">{r.name}</span>
                          </div>
                          <div className="text-xs text-slate-400 mt-1 truncate font-mono bg-slate-50 inline-block px-1 rounded">{r.address}</div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 mt-1 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 shrink-0" />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>

            {/* Right Column: Terminal */}
            <div className="flex-1 bg-slate-50 rounded-xl flex flex-col overflow-hidden card-shadow border border-slate-200 relative">
              {/* Terminal Header */}
              <div className="h-12 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5 p-1.5 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300 hover:bg-red-400 transition-colors" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300 hover:bg-yellow-400 transition-colors" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300 hover:bg-green-400 transition-colors" />
                  </div>
                  <span className="text-xs font-mono text-slate-500 font-medium flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-slate-400" />
                    output.log
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-navy animate-pulse" />
                    <span className="text-[10px] font-bold text-brand-navy uppercase tracking-wide">Ao Vivo</span>
                  </span>
                  <div className="h-4 w-px bg-slate-200 mx-1" />
                  <button className="text-slate-400 hover:text-brand-navy transition-colors p-1 hover:bg-slate-100 rounded" title="Copiar Logs">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button className="text-slate-400 hover:text-brand-navy transition-colors p-1 hover:bg-slate-100 rounded" title="Baixar">
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Terminal Output */}
              <ScrollArea className="flex-1">
                <div className="p-6 font-mono text-sm leading-relaxed">
                  <div className="space-y-0.5">
                    {terminalLines.map((line) => (
                      <div
                        key={line.line}
                        className={cn(
                          'flex',
                          line.highlight && 'bg-blue-50 -mx-6 px-6 border-l-4 border-brand-navy py-1 mt-2 mb-1'
                        )}
                      >
                        <span className="w-8 select-none text-right mr-6 opacity-30 text-xs mt-[2px] font-bold text-slate-400 shrink-0">{line.line}</span>
                        <span className={cn(line.color, 'whitespace-pre-wrap')}>{line.text}</span>
                      </div>
                    ))}
                    <div className="flex text-slate-500 pt-4 items-center">
                      <span className="mr-2 font-bold text-slate-400">$</span>
                      <span className="mr-2">Aguardando Aprovação...</span>
                      <span className="w-2 h-4 bg-brand-navy block animate-pulse" />
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
