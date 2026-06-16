import { useEffect, useState } from 'react'
import { Shield, ShieldCheck, ShieldOff, Users, Loader2, Plus } from 'lucide-react'
import { api } from '@/api/client'

interface Role {
  id: string
  name: string
  tenantId: string
  permissions: string
  createdAt: string
}

export function IAMModule() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<Role[]>('/iam/roles/default')
      .then(setRoles)
      .catch(() => setRoles([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-brand-navy" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-navy font-display">IAM</h1>
        <p className="text-sm text-slate-400">Gerenciamento de identidade e acesso</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="bg-white rounded-3xl p-5 card-shadow border border-slate-100 flex-1">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-ice-blue p-3">
              <Shield className="h-5 w-5 text-brand-navy" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Total de Roles</p>
              <p className="text-2xl font-bold text-brand-navy">{roles.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-3xl p-5 card-shadow border border-slate-100 flex-1">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-ice-blue p-3">
              <Users className="h-5 w-5 text-brand-navy" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Permissões</p>
              <p className="text-2xl font-bold text-brand-navy">{roles.reduce((acc, r) => acc + (r.permissions ? r.permissions.split(',').length : 0), 0)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl card-shadow border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-lime" />
            <h2 className="text-xs font-bold tracking-widest text-slate-400 uppercase">Roles</h2>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-navy text-white text-[11px] font-bold hover:bg-brand-navy/90 transition-all">
            <Plus className="w-3 h-3" />
            Nova Role
          </button>
        </div>
        {roles.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-sm text-slate-400">
            <ShieldOff className="w-5 h-5 mr-2" />
            Nenhuma role configurada
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {roles.map((role) => (
              <div key={role.id} className="flex items-center gap-4 p-5 hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-ice-blue flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-brand-navy" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-brand-navy">{role.name}</p>
                  <p className="text-xs text-slate-400">Tenant: {role.tenantId}</p>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <p>{role.permissions ? role.permissions.split(',').length : 0} permissões</p>
                  <p className="text-slate-300">{new Date(role.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
