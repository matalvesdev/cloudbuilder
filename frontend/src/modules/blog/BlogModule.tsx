import { useState } from 'react'
import {
  BookOpen, Clock, Tag, ArrowRight,
  User, Calendar, Search, Mail,
  CheckCircle, Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/* ──────────── Blog Posts Data ──────────── */

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  author: string
  date: string
  readTime: string
  category: string
  tags: string[]
  featured?: boolean
}

const BLOG_POSTS: BlogPost[] = [
  {
    id: '1',
    title: 'O que é Platform Engineering e por que sua empresa precisa',
    slug: 'o-que-e-platform-engineering',
    excerpt: 'Platform Engineering é a prática de construir uma plataforma interna que permite que devs provisionem infraestrutura de forma self-service.',
    content: `# O que é Platform Engineering

Platform Engineering é a prática de construir uma plataforma interna que permite que equipes de desenvolvimento provisionem e gerenciem infraestrutura de forma self-service, com guard rails de segurança e governança.

## O problema que resolve

Imagine um time de 50 desenvolvedores precisando provisionar ambientes de staging. Cada dev precisa pedir para o time de infraestrutura. O processo leva 3-5 dias. Cada dev provisiona de um jeito diferente.

## Benefícios mensuráveis

- **Redução de 80% no tempo de provisioning**
- **Redução de 40% em custos cloud**
- **Redução de 50% em incidentes**
- **Aumento de 30% na produtividade dos devs**

## Como começar

1. Avalie a maturidade atual
2. Comece com templates padrão
3. Implemente RBAC e governança
4. Integre com GitOps
5. Meça resultados`,
    author: 'CloudBuilder Team',
    date: '2026-08-12',
    readTime: '8 min',
    category: 'Platform Engineering',
    tags: ['Platform Engineering', 'DevOps', 'IDP'],
    featured: true,
  },
  {
    id: '2',
    title: 'FinOps: Como controlar custos cloud sem morrer de medo',
    slug: 'finops-guia-completo',
    excerpt: 'FinOps é a prática de gerenciar custos cloud de forma disciplinada. É o cruzamento entre finanças, tecnologia e negócios.',
    content: `# FinOps: Guia Completo

FinOps é a prática de gerenciar custos cloud de forma disciplinada. É o cruzamento entre finanças, tecnologia e negócios.

## 5 passos para começar

### 1. Dashboard de Custos
Tenha visibilidade completa de custos por provider, serviço e time.

### 2. Budget Alerts
Configure alertas em 80% e 100% do orçamento.

### 3. Anomaly Detection
Detecte custos fora do padrão automaticamente.

### 4. What-If Analysis
Estime custos antes de provisionar.

### 5. Otimização Contínua
Right-sizing, reserved instances, spot instances.`,
    author: 'CloudBuilder Team',
    date: '2026-08-10',
    readTime: '10 min',
    category: 'FinOps',
    tags: ['FinOps', 'Cloud Cost', 'Optimization'],
  },
  {
    id: '3',
    title: 'Terraform Visual: O fim da complexidade de IaC',
    slug: 'terraform-visual-solucionar-problema',
    excerpt: 'Para provisionar uma VPC simples, você precisa de 200-300 linhas de HCL. E se você pudesse fazer tudo arrastando e soltando recursos?',
    content: `# Terraform Visual

Terraform revolucionou a gestão de infraestrutura, mas criou um problema: complexidade.

## Como funciona o CloudBuilder

1. Arraste recursos para o canvas
2. Conecte-os arrastando de um para outro
3. Configure propriedades
4. Valide o design
5. Gere Terraform com um clique

## O que é gerado

- main.tf — Recursos principais
- variables.tf — Variáveis de entrada
- outputs.tf — Outputs de saída
- providers.tf — Configuração de providers
- versions.tf — Versões de provider`,
    author: 'CloudBuilder Team',
    date: '2026-08-08',
    readTime: '8 min',
    category: 'Terraform',
    tags: ['Terraform', 'IaC', 'Visual'],
  },
  {
    id: '4',
    title: 'Como a [Fintech X] reduziu custos cloud em 40%',
    slug: 'case-study-reducao-custos',
    excerpt: 'Uma fintech brasileira com 120 desenvolvedores estava crescendo rápido, mas sem governança. Veja como resolveram.',
    content: `# Case Study: Fintech

## O problema
- 120 devs crescendo rápido
- 40% de custos redundantes
- 12 incidentes por mês

## A solução
1. Templates padrão
2. Canvas visual
3. RBAC e governança
4. FinOps integrado

## Resultados
- 40% redução em custos
- 75% redução em incidentes
- 144% aumento na satisfação`,
    author: 'CloudBuilder Team',
    date: '2026-08-06',
    readTime: '7 min',
    category: 'Case Study',
    tags: ['Case Study', 'Fintech', 'Cost Reduction'],
  },
  {
    id: '5',
    title: '5 dicas de FinOps que todo dev deveria saber',
    slug: '5-dicas-finops-desenvolvedores',
    excerpt: 'FinOps não é só para o time de finanças. Desenvolvedores têm um papel crucial na otimização de custos cloud.',
    content: `# 5 Dicas de FinOps

## 1. Entenda o custo do seu código
Antes de deployar, pergunte: quanto custa rodar isso?

## 2. Delete o que não está usando
Weekly cleanup reduz custos em 15-25%.

## 3. Use ambientes efêmeros
10 devs podem compartilhar 2 ambientes em vez de 10.

## 4. Right-size suas instâncias
Migrar de m5.2xlarge para m5.xlarge reduz custo em 50%.

## 5. Reserve para carga estável
Reserved Instances reduz custo em 40% vs on-demand.`,
    author: 'CloudBuilder Team',
    date: '2026-08-04',
    readTime: '6 min',
    category: 'FinOps',
    tags: ['FinOps', 'Developer Tips', 'Cloud Cost'],
  },
]

/* ──────────── Newsletter Signup ──────────── */

function NewsletterSignup() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setStatus('loading')
    // Simulate API call
    await new Promise(r => setTimeout(r, 1000))
    setStatus('success')
    setEmail('')
  }

  return (
    <div className="bg-brand-navy rounded-2xl p-8 text-white">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-brand-lime/20 flex items-center justify-center">
          <Mail className="w-5 h-5 text-brand-lime" />
        </div>
        <div>
          <h3 className="text-lg font-bold font-display">CloudBuilder Weekly</h3>
          <p className="text-sm text-white/60">Newsletter semanal sobre Platform Engineering</p>
        </div>
      </div>
      <p className="text-sm text-white/80 mb-4">
        Toda terça-feira: destaque técnico, links úteis, dicas rápidas e novidades do produto.
      </p>
      {status === 'success' ? (
        <div className="flex items-center gap-2 text-brand-lime text-sm font-medium">
          <CheckCircle className="w-4 h-4" />
          Inscrito com sucesso! Confira seu email.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="flex-1 h-10 px-4 rounded-lg bg-white/10 border border-white/20 text-sm placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-brand-lime/50"
            required
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="h-10 px-6 rounded-lg bg-brand-lime text-brand-navy text-sm font-bold hover:bg-brand-lime/90 transition-all disabled:opacity-50"
          >
            {status === 'loading' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Inscrever'
            )}
          </button>
        </form>
      )}
    </div>
  )
}

/* ──────────── Blog Post Card ──────────── */

function BlogPostCard({ post, onClick }: { post: BlogPost; onClick: () => void }) {
  return (
    <article
      className="group bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg hover:border-brand-navy/20 transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="px-2.5 py-1 rounded-lg bg-ice-blue/50 text-brand-navy text-[10px] font-bold uppercase tracking-wider">
          {post.category}
        </span>
        {post.featured && (
          <span className="px-2.5 py-1 rounded-lg bg-brand-lime/20 text-brand-navy text-[10px] font-bold uppercase tracking-wider">
            Destaque
          </span>
        )}
      </div>
      <h2 className="text-lg font-bold text-brand-navy font-display mb-2 group-hover:text-brand-lime transition-colors">
        {post.title}
      </h2>
      <p className="text-sm text-slate-500 mb-4 line-clamp-2">
        {post.excerpt}
      </p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {post.author}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(post.date).toLocaleDateString('pt-BR')}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {post.readTime}
          </span>
        </div>
        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-lime group-hover:translate-x-1 transition-all" />
      </div>
    </article>
  )
}

/* ──────────── Blog Post View ──────────── */

function BlogPostView({ post, onBack }: { post: BlogPost; onBack: () => void }) {
  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-brand-navy mb-6 transition-colors"
      >
        ← Voltar ao blog
      </button>
      <article>
        <div className="flex items-center gap-2 mb-4">
          <span className="px-2.5 py-1 rounded-lg bg-ice-blue/50 text-brand-navy text-[10px] font-bold uppercase tracking-wider">
            {post.category}
          </span>
          <span className="text-xs text-slate-400">
            {new Date(post.date).toLocaleDateString('pt-BR')}
          </span>
        </div>
        <h1 className="text-3xl font-bold text-brand-navy font-display mb-4">
          {post.title}
        </h1>
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-200">
          <span className="flex items-center gap-1.5 text-sm text-slate-500">
            <User className="w-4 h-4" />
            {post.author}
          </span>
          <span className="flex items-center gap-1.5 text-sm text-slate-500">
            <Clock className="w-4 h-4" />
            {post.readTime} de leitura
          </span>
        </div>
        <div className="prose-custom">
          {post.content.split('\n').map((line, i) => {
            if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold text-brand-navy mt-8 mb-4">{line.slice(2)}</h1>
            if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold text-brand-navy mt-6 mb-3">{line.slice(3)}</h2>
            if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-bold text-brand-navy mt-4 mb-2">{line.slice(4)}</h3>
            if (line.startsWith('- ')) return <li key={i} className="text-sm text-slate-600 ml-4 mb-1">{line.slice(2)}</li>
            if (line.match(/^\d+\./)) return <li key={i} className="text-sm text-slate-600 ml-4 mb-1">{line}</li>
            if (line.trim() === '') return <br key={i} />
            return <p key={i} className="text-sm text-slate-600 mb-3 leading-relaxed">{line}</p>
          })}
        </div>
        <div className="mt-8 pt-6 border-t border-slate-200">
          <div className="flex flex-wrap gap-2">
            {post.tags.map(tag => (
              <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-xs text-slate-500">
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        </div>
      </article>
    </div>
  )
}

/* ──────────── Main Module ──────────── */

export function BlogModule() {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredPosts = BLOG_POSTS.filter(post => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      post.title.toLowerCase().includes(q) ||
      post.excerpt.toLowerCase().includes(q) ||
      post.tags.some(t => t.toLowerCase().includes(q))
    )
  })

  if (selectedPost) {
    return (
      <div className="h-full overflow-y-auto bg-slate-50 p-8">
        <BlogPostView post={selectedPost} onBack={() => setSelectedPost(null)} />
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-6 h-6 text-brand-navy" />
            <h1 className="text-2xl font-bold text-brand-navy font-display">Blog</h1>
          </div>
          <p className="text-sm text-slate-500 mb-6">
            Artigos sobre Platform Engineering, FinOps e gestão de infraestrutura cloud.
          </p>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar artigos..."
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/10 focus:border-brand-navy/30 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-8">
        <div className="grid gap-6">
          {filteredPosts.map(post => (
            <BlogPostCard
              key={post.id}
              post={post}
              onClick={() => setSelectedPost(post)}
            />
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-400">Nenhum artigo encontrado</p>
          </div>
        )}

        {/* Newsletter Signup */}
        <div className="mt-12">
          <NewsletterSignup />
        </div>
      </div>
    </div>
  )
}
