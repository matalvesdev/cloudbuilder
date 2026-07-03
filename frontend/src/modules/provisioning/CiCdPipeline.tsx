import { useState } from 'react'
import {
  Loader2,
  CheckCircle2,
  GitBranch,
  GitFork,
  FileCode2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRepoStore } from '@/store/repoStore'
import type { RepoProvider } from '@/types/repo.types'

interface CiCdPipelineProps {
  repoId: string
  onClose: () => void
}

export function CiCdPipeline({ repoId, onClose }: CiCdPipelineProps) {
  const repo = useRepoStore((s) => s.getRepoById(repoId))
  const result = useRepoStore((s) => s.scanResults.find((r) => r.repoId === repoId))
  const detection = repoId ? useRepoStore((s) => s.detectAppType(repoId)) : null

  const [ciProvider, setCiProvider] = useState<'github-actions' | 'gitlab-ci'>(
    repo?.provider === 'gitlab' ? 'gitlab-ci' : 'github-actions'
  )
  const [creating, setCreating] = useState(false)
  const [created, setCreated] = useState(false)

  if (!repo) return null

  const appTypeLabel = detection?.appType
    ? detection.appType === 'web-app' ? 'Web App' :
      detection.appType === 'microservice' ? 'Microsserviço' :
      detection.appType === 'data-pipeline' ? 'Data Pipeline' :
      detection.appType === 'docker-compose' ? 'Docker Compose' : 'Não detectado'
    : 'Não detectado'

  const pipelineYaml = ciProvider === 'github-actions'
    ? `name: CloudBuilder CI/CD

on:
  push:
    branches: [${repo.defaultBranch}]
  pull_request:
    branches: [${repo.defaultBranch}]

jobs:
  terraform:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: 1.9.0

      - name: Terraform Init
        run: terraform init
        working-directory: ./infra

      - name: Terraform Validate
        run: terraform validate
        working-directory: ./infra

      - name: Terraform Plan
        run: terraform plan -out=tfplan
        working-directory: ./infra

      - name: Terraform Apply
        if: github.ref == 'refs/heads/${repo.defaultBranch}'
        run: terraform apply -auto-approve tfplan
        working-directory: ./infra
        env:
          AWS_ACCESS_KEY_ID: \${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: \${{ secrets.AWS_SECRET_ACCESS_KEY }}

  deploy:
    needs: terraform
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/${repo.defaultBranch}'
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install Dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy
        run: npm run deploy
`
    : `stages:
  - validate
  - plan
  - deploy

variables:
  TF_ROOT: infra
  TF_VERSION: 1.9.0

image:
  name: hashicorp/terraform:\${TF_VERSION}
  entrypoint: [""]

cache:
  key: \${CI_COMMIT_REF_SLUG}
  paths:
    - \${TF_ROOT}/.terraform

before_script:
  - cd \${TF_ROOT}
  - terraform --version
  - terraform init

validate:
  stage: validate
  script:
    - terraform validate

plan:
  stage: plan
  script:
    - terraform plan -out=tfplan
  artifacts:
    paths:
      - \${TF_ROOT}/tfplan
  only:
    - ${repo.defaultBranch}

deploy:
  stage: deploy
  script:
    - terraform apply -auto-approve tfplan
  environment:
    name: production
  only:
    - ${repo.defaultBranch}
  dependencies:
    - plan
`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-brand-navy font-display">Configurar Pipeline CI/CD</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {repo.fullName} · {appTypeLabel}
          </p>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1">Tipo de App</p>
              <p className="text-sm font-bold text-brand-navy">{appTypeLabel}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1">Linguagem</p>
              <p className="text-sm font-bold text-brand-navy">{detection?.language || '—'}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1">Framework</p>
              <p className="text-sm font-bold text-brand-navy">{detection?.framework || '—'}</p>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Provedor de CI
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setCiProvider('github-actions')}
                className={cn(
                  'flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium',
                  ciProvider === 'github-actions'
                    ? 'border-brand-navy bg-brand-navy/5 text-brand-navy'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                )}
              >
                <GitBranch className="w-4 h-4" />
                GitHub Actions
              </button>
              <button
                onClick={() => setCiProvider('gitlab-ci')}
                disabled={repo.provider === 'bitbucket'}
                className={cn(
                  'flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium',
                  ciProvider === 'gitlab-ci'
                    ? 'border-brand-navy bg-brand-navy/5 text-brand-navy'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300',
                  repo.provider === 'bitbucket' && 'opacity-40 cursor-not-allowed'
                )}
              >
                <GitFork className="w-4 h-4" />
                GitLab CI
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Pipeline YAML
            </label>
            <div className="relative group">
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(pipelineYaml)
                }}
                className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium bg-white/10 text-slate-400 hover:bg-white/20 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
              >
                <FileCode2 className="w-3 h-3" />
                Copiar
              </button>
              <pre className="bg-[#0D1B2A] rounded-xl p-4 font-mono text-[10px] leading-relaxed max-h-[280px] overflow-y-auto text-slate-300 whitespace-pre scrollbar-thin border border-slate-700">
                {pipelineYaml}
              </pre>
            </div>
          </div>

          {created && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-700">Pipeline criado com sucesso!</p>
                <p className="text-xs text-green-500">
                  PR aberto em <strong>{repo.fullName}</strong> com o arquivo de pipeline configurado
                </p>
              </div>
            </div>
          )}

          {creating && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-blue-700">Criando pipeline...</p>
                <p className="text-xs text-blue-500">Abrindo PR com configuração de CI/CD</p>
              </div>
            </div>
          )}
        </div>
        <div className="p-6 pt-0 flex items-center justify-end gap-2 border-t border-slate-100">
          <button
            onClick={onClose}
            disabled={creating}
            className="px-4 h-9 rounded-full text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all disabled:opacity-50"
          >
            {created ? 'Fechar' : 'Cancelar'}
          </button>
          {!created && (
            <button
              onClick={async () => {
                setCreating(true)
                await new Promise((r) => setTimeout(r, 2000))
                setCreating(false)
                setCreated(true)
              }}
              disabled={creating}
              className="inline-flex items-center gap-1.5 px-5 h-9 rounded-full text-xs font-bold bg-brand-navy text-white hover:bg-[#0D1B2A] transition-all disabled:opacity-50"
            >
              {creating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <GitBranch className="w-3.5 h-3.5" />
              )}
              {creating ? 'Criando...' : 'Criar PR com Pipeline'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
