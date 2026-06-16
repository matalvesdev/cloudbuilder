import { useAuthStore } from '@/store/authStore'
import { Building2, ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

export function TenantSelector() {
  const user = useAuthStore((s) => s.user)
  const tenantName = user?.tenantName
  const tenantSlug = user?.tenantSlug

  if (!tenantName) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 px-2 text-sm text-brand-ice-blue hover:text-white">
          <Building2 className="h-4 w-4 text-brand-lime" />
          <span className="max-w-[140px] truncate">{tenantName}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <div className="px-2 py-1.5 text-xs text-muted-foreground">
          {tenantSlug && <span className="block font-mono text-[10px]">/{tenantSlug}</span>}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled className="text-xs text-muted-foreground">
          Gerenciar organização
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
