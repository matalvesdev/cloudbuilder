import type { ComponentDefinition } from '@/types/canvas.types'

const providerLogos: Record<string, string> = {
  aws: `<svg viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7v10l10 5 10-5V7l-10-5z" fill="#FF9900"/><path d="M8 10l4 2 4-2" stroke="#fff" stroke-width="1.5" fill="none"/><path d="M12 12v5" stroke="#fff" stroke-width="1.5"/></svg>`,
  azure: `<svg viewBox="0 0 24 24" fill="none"><rect x="4" y="10" width="7" height="10" rx="2" fill="#0078D4"/><rect x="13" y="4" width="7" height="16" rx="2" fill="#0078D4" opacity=".7"/></svg>`,
  gcp: `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#4285F4"/><rect x="7" y="7" width="10" height="10" rx="3" fill="#fff"/><path d="M12 7v10M7 12h10" stroke="#4285F4" stroke-width="1.5"/></svg>`,
  k8s: `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#326CE5"/><path d="M12 6v12M7 12h10" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/><circle cx="12" cy="12" r="3" stroke="#fff" stroke-width="1.5" fill="none"/></svg>`,
  vercel: `<svg viewBox="0 0 24 24" fill="none"><path d="M12 2L2 22h20L12 2z" fill="#000"/></svg>`,
  supabase: `<svg viewBox="0 0 24 24" fill="none"><path d="M14 2l-8 13h6l-2 7 8-13h-6l2-7z" fill="#3ECF8E"/></svg>`,
  render: `<svg viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" rx="4" fill="#46E3B7"/><path d="M12 8v8M8 12h8" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/></svg>`,
}

const awsServiceIcons: Record<string, string> = {
  'aws-vpc': `<svg viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" rx="3" stroke="#FF9900" stroke-width="1.5" fill="none"/><path d="M4 10h16M12 4v6" stroke="#FF9900" stroke-width="1.2"/><circle cx="8" cy="14" r="1.5" fill="#FF9900"/><circle cx="12" cy="14" r="1.5" fill="#FF9900"/><circle cx="16" cy="14" r="1.5" fill="#FF9900"/></svg>`,
  'aws-subnet': `<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="8" width="18" height="8" rx="2" stroke="#FF9900" stroke-width="1.5" fill="none" opacity=".8"/><rect x="3" y="8" width="9" height="8" rx="2" stroke="#FF9900" stroke-width="1.5" fill="none"/><text x="7" y="15" fill="#FF9900" font-size="6" text-anchor="middle" font-weight="bold">PUB</text></svg>`,
  'aws-igw': `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="7" stroke="#FF9900" stroke-width="1.5" fill="none"/><path d="M12 2v20M2 12h20" stroke="#FF9900" stroke-width="1.2" opacity=".3"/><path d="M12 5l3 4h-2v6h2l-3 4-3-4h2V9H9l3-4z" fill="#FF9900"/></svg>`,
  'aws-natgw': `<svg viewBox="0 0 24 24" fill="none"><rect x="5" y="5" width="14" height="14" rx="3" stroke="#FF9900" stroke-width="1.5" fill="none"/><path d="M12 9v6M9 12h6" stroke="#FF9900" stroke-width="1.5" stroke-linecap="round"/><path d="M16 8l4 4-4 4" stroke="#FF9900" stroke-width="1.2" fill="none"/><path d="M8 8l-4 4 4 4" stroke="#FF9900" stroke-width="1.2" fill="none"/></svg>`,
  'aws-rtb': `<svg viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" rx="2" stroke="#FF9900" stroke-width="1.5" fill="none"/><path d="M4 10h16M10 4v16" stroke="#FF9900" stroke-width="1" opacity=".5"/><text x="12" y="15" fill="#FF9900" font-size="5" text-anchor="middle" font-weight="bold">RT</text></svg>`,
  'aws-ec2': `<svg viewBox="0 0 24 24" fill="none"><rect x="5" y="3" width="14" height="18" rx="2" stroke="#FF9900" stroke-width="1.5" fill="none"/><rect x="7" y="6" width="10" height="2" rx=".5" fill="#FF9900" opacity=".6"/><rect x="7" y="9.5" width="10" height="2" rx=".5" fill="#FF9900" opacity=".6"/><rect x="7" y="13" width="10" height="2" rx=".5" fill="#FF9900" opacity=".6"/><circle cx="12" cy="18" r="1.5" fill="#FF9900"/></svg>`,
  'aws-asg': `<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="8" height="8" rx="1.5" stroke="#FF9900" stroke-width="1.5" fill="none"/><rect x="13" y="3" width="8" height="8" rx="1.5" stroke="#FF9900" stroke-width="1.5" fill="none"/><rect x="3" y="13" width="8" height="8" rx="1.5" stroke="#FF9900" stroke-width="1.5" fill="none"/><rect x="13" y="13" width="8" height="8" rx="1.5" stroke="#FF9900" stroke-width="1.5" fill="none"/><path d="M7 11v2M17 11v2M7 13l-2 2h4l-2-2zM17 13l-2 2h4l-2-2zM11 7h2M11 17h2M13 7l2-2-2-2v4zM13 17l2-2-2-2v4z" stroke="#FF9900" stroke-width="1" fill="none"/></svg>`,
  'aws-lt': `<svg viewBox="0 0 24 24" fill="none"><rect x="4" y="3" width="16" height="18" rx="2" stroke="#FF9900" stroke-width="1.5" fill="none"/><path d="M7 7h10M7 11h10M7 15h8" stroke="#FF9900" stroke-width="1.2" stroke-linecap="round"/><rect x="12" y="16" width="3" height="2" rx=".5" fill="#FF9900" opacity=".5"/></svg>`,
  'aws-rds': `<svg viewBox="0 0 24 24" fill="none"><path d="M4 6c0-1.1 3.6-2 8-2s8 .9 8 2v12c0 1.1-3.6 2-8 2s-8-.9-8-2V6z" stroke="#FF9900" stroke-width="1.5" fill="none"/><path d="M4 6c0 1.1 3.6 2 8 2s8-.9 8-2" stroke="#FF9900" stroke-width="1" fill="none" opacity=".5"/><path d="M4 10c0 1.1 3.6 2 8 2s8-.9 8-2" stroke="#FF9900" stroke-width="1" fill="none" opacity=".5"/><path d="M4 14c0 1.1 3.6 2 8 2s8-.9 8-2" stroke="#FF9900" stroke-width="1" fill="none" opacity=".5"/><rect x="10" y="15" width="4" height="4" rx="1" fill="#FF9900"/></svg>`,
  'aws-rds-cluster': `<svg viewBox="0 0 24 24" fill="none"><path d="M3 5c0-1.1 3.6-2 8-2s8 .9 8 2v10c0 1.1-3.6 2-8 2s-8-.9-8-2V5z" stroke="#FF9900" stroke-width="1.2" fill="none"/><path d="M3 5c0 1.1 3.6 2 8 2s8-.9 8-2" stroke="#FF9900" stroke-width=".8" fill="none" opacity=".5"/><path d="M3 9c0 1.1 3.6 2 8 2s8-.9 8-2" stroke="#FF9900" stroke-width=".8" fill="none" opacity=".5"/><circle cx="5" cy="16" r="3" stroke="#FF9900" stroke-width="1.2" fill="none"/><circle cx="5" cy="16" r="1" fill="#FF9900"/><circle cx="16" cy="18" r="2.5" stroke="#FF9900" stroke-width="1.2" fill="none"/><circle cx="16" cy="18" r=".8" fill="#FF9900"/><path d="M11 16l3.5 1" stroke="#FF9900" stroke-width="1"/></svg>`,
  'aws-elasticache': `<svg viewBox="0 0 24 24" fill="none"><path d="M4 5c0-1.1 3.6-2 8-2s8 .9 8 2v12c0 1.1-3.6 2-8 2s-8-.9-8-2V5z" stroke="#FF9900" stroke-width="1.5" fill="none"/><path d="M12 7v6M9 10h6" stroke="#FF9900" stroke-width="1.5" stroke-linecap="round"/><circle cx="12" cy="17" r="1.5" fill="#FF9900"/></svg>`,
  'aws-dynamodb': `<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2" stroke="#FF9900" stroke-width="1.5" fill="none"/><path d="M3 10h18M12 4v16" stroke="#FF9900" stroke-width="1" opacity=".5"/><text x="12" y="14" fill="#FF9900" font-size="4" text-anchor="middle" font-weight="bold">DB</text></svg>`,
  'aws-alb': `<svg viewBox="0 0 24 24" fill="none"><rect x="8" y="3" width="8" height="5" rx="1.5" stroke="#FF9900" stroke-width="1.5" fill="none"/><path d="M12 8v4" stroke="#FF9900" stroke-width="1.5"/><path d="M7 15l5-3 5 3" stroke="#FF9900" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><rect x="4" y="16" width="5" height="5" rx="1" stroke="#FF9900" stroke-width="1.2" fill="none"/><rect x="15" y="16" width="5" height="5" rx="1" stroke="#FF9900" stroke-width="1.2" fill="none"/></svg>`,
  'aws-nlb': `<svg viewBox="0 0 24 24" fill="none"><rect x="8" y="3" width="8" height="5" rx="1.5" stroke="#FF9900" stroke-width="1.5" fill="none"/><path d="M12 8v3" stroke="#FF9900" stroke-width="1.5"/><rect x="3" y="12" width="18" height="3" rx="1" stroke="#FF9900" stroke-width="1.2" fill="none"/><rect x="4" y="17" width="4" height="5" rx="1" stroke="#FF9900" stroke-width="1.2" fill="none"/><rect x="16" y="17" width="4" height="5" rx="1" stroke="#FF9900" stroke-width="1.2" fill="none"/></svg>`,
  'aws-tg': `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="#FF9900" stroke-width="1.5" fill="none"/><circle cx="12" cy="12" r="4" stroke="#FF9900" stroke-width="1.5" fill="none"/><circle cx="12" cy="12" r="1.5" fill="#FF9900"/></svg>`,
  'aws-s3': `<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="3" stroke="#FF9900" stroke-width="1.5" fill="none"/><path d="M3 8h18M3 12h18M3 16h18" stroke="#FF9900" stroke-width="1" opacity=".4"/><rect x="8" y="5" width="8" height="2" rx=".5" fill="#FF9900" opacity=".6"/></svg>`,
  'aws-ebs': `<svg viewBox="0 0 24 24" fill="none"><rect x="6" y="3" width="12" height="18" rx="2" stroke="#FF9900" stroke-width="1.5" fill="none"/><rect x="9" y="6" width="6" height="12" rx="1" stroke="#FF9900" stroke-width="1.2" fill="none" opacity=".6"/><circle cx="12" cy="12" r="3" stroke="#FF9900" stroke-width="1.2" fill="none"/></svg>`,
  'aws-efs': `<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="4" stroke="#FF9900" stroke-width="1.5" fill="none"/><path d="M7 7h10M7 12h10M7 17h6" stroke="#FF9900" stroke-width="1.2" stroke-linecap="round"/><circle cx="17" cy="17" r="2" stroke="#FF9900" stroke-width="1" fill="none"/></svg>`,
  'aws-sg': `<svg viewBox="0 0 24 24" fill="none"><path d="M12 3c-4 0-8 2-8 6v4l8 8 8-8V9c0-4-4-6-8-6z" stroke="#FF9900" stroke-width="1.5" fill="none"/><path d="M9 12l2 2 4-4" stroke="#FF9900" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
  'aws-nacl': `<svg viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" rx="3" stroke="#FF9900" stroke-width="1.5" fill="none"/><path d="M7 7h10M7 12h10M7 17h10" stroke="#FF9900" stroke-width="1" stroke-linecap="round"/><path d="M16 10l2 2-2 2" stroke="#FF9900" stroke-width="1.2" fill="none"/><path d="M8 10l-2 2 2 2" stroke="#FF9900" stroke-width="1.2" fill="none"/></svg>`,
  'aws-ecs': `<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="#FF9900" stroke-width="1.5" fill="none"/><rect x="7" y="7" width="10" height="10" rx="2" stroke="#FF9900" stroke-width="1.2" fill="none"/><circle cx="12" cy="12" r="2.5" stroke="#FF9900" stroke-width="1.2" fill="none"/><circle cx="12" cy="12" r="1" fill="#FF9900"/></svg>`,
  'aws-ecr': `<svg viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" rx="3" stroke="#FF9900" stroke-width="1.5" fill="none"/><circle cx="12" cy="12" r="4" stroke="#FF9900" stroke-width="1.5" fill="none"/><circle cx="12" cy="12" r="1.5" fill="#FF9900"/><path d="M12 4v3M12 17v3M4 12h3M17 12h3" stroke="#FF9900" stroke-width="1" opacity=".4"/></svg>`,
  'aws-lambda': `<svg viewBox="0 0 24 24" fill="none"><path d="M5 4l6 8-6 8" stroke="#FF9900" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M14 20h5" stroke="#FF9900" stroke-width="1.5" stroke-linecap="round"/><path d="M11 12h8" stroke="#FF9900" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  'aws-sqs': `<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="7" width="7" height="10" rx="2" stroke="#FF9900" stroke-width="1.5" fill="none"/><rect x="14" y="7" width="7" height="10" rx="2" stroke="#FF9900" stroke-width="1.5" fill="none"/><path d="M10 12h4" stroke="#FF9900" stroke-width="1.5"/><path d="M10 9h4M10 15h4" stroke="#FF9900" stroke-width="1" opacity=".5"/></svg>`,
  'aws-sns': `<svg viewBox="0 0 24 24" fill="none"><path d="M12 5C8.7 5 6 7.2 6 10c0 1.7.8 3.2 2 4.3V19l3.5-3h.5c3.3 0 6-2.2 6-5s-2.7-6-6-6z" stroke="#FF9900" stroke-width="1.5" fill="none"/><path d="M9 10h6M12 7v6" stroke="#FF9900" stroke-width="1" opacity=".6" stroke-linecap="round"/></svg>`,
  'aws-cw': `<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="12" rx="2" stroke="#FF9900" stroke-width="1.5" fill="none"/><path d="M7 15l3-6 3 4 4-8" stroke="#FF9900" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
}

const azureServiceIcons: Record<string, string> = {
  'azure-vnet': `<svg viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" rx="3" stroke="#0078D4" stroke-width="1.5" fill="none"/><path d="M4 10h16M12 4v6" stroke="#0078D4" stroke-width="1.2"/><circle cx="8" cy="15" r="1.5" fill="#0078D4"/><circle cx="12" cy="15" r="1.5" fill="#0078D4"/><circle cx="16" cy="15" r="1.5" fill="#0078D4"/></svg>`,
  'azure-subnet': `<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="8" width="18" height="8" rx="2" stroke="#0078D4" stroke-width="1.5" fill="none" opacity=".7"/><rect x="3" y="8" width="10" height="8" rx="2" stroke="#0078D4" stroke-width="1.5" fill="none"/><text x="8" y="15" fill="#0078D4" font-size="5" text-anchor="middle" font-weight="bold">SN</text></svg>`,
  'azure-vm': `<svg viewBox="0 0 24 24" fill="none"><rect x="5" y="3" width="14" height="15" rx="2" stroke="#0078D4" stroke-width="1.5" fill="none"/><rect x="7" y="6" width="10" height="2" rx=".5" fill="#0078D4" opacity=".5"/><rect x="7" y="9" width="10" height="2" rx=".5" fill="#0078D4" opacity=".5"/><rect x="7" y="12" width="7" height="2" rx=".5" fill="#0078D4" opacity=".5"/><rect x="10" y="18" width="4" height="3" rx=".5" fill="#0078D4" opacity=".7"/></svg>`,
  'azure-aks': `<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="#0078D4" stroke-width="1.5" fill="none"/><rect x="7" y="7" width="10" height="10" rx="2" stroke="#0078D4" stroke-width="1.2" fill="none"/><circle cx="12" cy="12" r="2" fill="#0078D4" opacity=".7"/></svg>`,
  'azure-sql': `<svg viewBox="0 0 24 24" fill="none"><path d="M4 5c0-1.1 3.6-2 8-2s8 .9 8 2v14c0 1.1-3.6 2-8 2s-8-.9-8-2V5z" stroke="#0078D4" stroke-width="1.5" fill="none"/><path d="M4 5c0 1.1 3.6 2 8 2s8-.9 8-2" stroke="#0078D4" stroke-width="1" fill="none" opacity=".4"/><path d="M4 10c0 1.1 3.6 2 8 2s8-.9 8-2" stroke="#0078D4" stroke-width="1" fill="none" opacity=".4"/><path d="M4 15c0 1.1 3.6 2 8 2s8-.9 8-2" stroke="#0078D4" stroke-width="1" fill="none" opacity=".4"/></svg>`,
  'azure-appgw': `<svg viewBox="0 0 24 24" fill="none"><rect x="8" y="3" width="8" height="4" rx="1" stroke="#0078D4" stroke-width="1.5" fill="none"/><path d="M12 7v3" stroke="#0078D4" stroke-width="1.5"/><rect x="3" y="11" width="18" height="3" rx="1" stroke="#0078D4" stroke-width="1.5" fill="none"/><rect x="4" y="16" width="4" height="5" rx="1" stroke="#0078D4" stroke-width="1.2" fill="none"/><rect x="16" y="16" width="4" height="5" rx="1" stroke="#0078D4" stroke-width="1.2" fill="none"/></svg>`,
  'azure-storage': `<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="3" stroke="#0078D4" stroke-width="1.5" fill="none"/><rect x="5" y="7" width="6" height="4" rx="1" stroke="#0078D4" stroke-width="1.2" fill="none"/><rect x="5" y="13" width="6" height="4" rx="1" stroke="#0078D4" stroke-width="1.2" fill="none"/><rect x="13" y="7" width="6" height="4" rx="1" stroke="#0078D4" stroke-width="1.2" fill="none"/><rect x="13" y="13" width="6" height="4" rx="1" stroke="#0078D4" stroke-width="1.2" fill="none"/></svg>`,
  'azure-func': `<svg viewBox="0 0 24 24" fill="none"><path d="M5 4l7 8-7 8" stroke="#0078D4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M15 4l4 8-4 8" stroke="#0078D4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
  'azure-nsg': `<svg viewBox="0 0 24 24" fill="none"><path d="M12 3c-4 0-8 2-8 6v4l8 8 8-8V9c0-4-4-6-8-6z" stroke="#0078D4" stroke-width="1.5" fill="none"/><rect x="8" y="8" width="8" height="8" rx="1.5" stroke="#0078D4" stroke-width="1" fill="none"/></svg>`,
}

const gcpServiceIcons: Record<string, string> = {
  'gcp-vpc': `<svg viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" rx="3" stroke="#4285F4" stroke-width="1.5" fill="none"/><path d="M4 10h16M12 4v6" stroke="#4285F4" stroke-width="1.2"/><circle cx="8" cy="15" r="1.5" fill="#4285F4"/><circle cx="12" cy="15" r="1.5" fill="#4285F4"/><circle cx="16" cy="15" r="1.5" fill="#4285F4"/></svg>`,
  'gcp-subnet': `<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="9" width="18" height="6" rx="2" stroke="#4285F4" stroke-width="1.5" fill="none" opacity=".7"/><rect x="3" y="9" width="9" height="6" rx="2" stroke="#4285F4" stroke-width="1.5" fill="none"/><text x="7" y="14" fill="#4285F4" font-size="5" text-anchor="middle" font-weight="bold">SN</text></svg>`,
  'gcp-vm': `<svg viewBox="0 0 24 24" fill="none"><rect x="5" y="3" width="14" height="18" rx="2" stroke="#4285F4" stroke-width="1.5" fill="none"/><rect x="7" y="6" width="10" height="2" rx=".5" fill="#4285F4" opacity=".5"/><rect x="7" y="9" width="10" height="2" rx=".5" fill="#4285F4" opacity=".5"/><rect x="7" y="12" width="10" height="2" rx=".5" fill="#4285F4" opacity=".5"/><rect x="9" y="17" width="6" height="2" rx=".5" fill="#4285F4" opacity=".5"/></svg>`,
  'gcp-gke': `<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="#4285F4" stroke-width="1.5" fill="none"/><circle cx="12" cy="12" r="5" stroke="#4285F4" stroke-width="1.5" fill="none"/><circle cx="12" cy="12" r="2" fill="#4285F4" opacity=".7"/></svg>`,
  'gcp-sql': `<svg viewBox="0 0 24 24" fill="none"><path d="M4 5c0-1.1 3.6-2 8-2s8 .9 8 2v14c0 1.1-3.6 2-8 2s-8-.9-8-2V5z" stroke="#4285F4" stroke-width="1.5" fill="none"/><path d="M4 5c0 1.1 3.6 2 8 2s8-.9 8-2" stroke="#4285F4" stroke-width="1" fill="none" opacity=".4"/><path d="M4 10c0 1.1 3.6 2 8 2s8-.9 8-2" stroke="#4285F4" stroke-width="1" fill="none" opacity=".4"/><path d="M4 15c0 1.1 3.6 2 8 2s8-.9 8-2" stroke="#4285F4" stroke-width="1" fill="none" opacity=".4"/></svg>`,
  'gcp-gcs': `<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="3" stroke="#4285F4" stroke-width="1.5" fill="none"/><rect x="5" y="8" width="14" height="2" rx=".5" fill="#4285F4" opacity=".4"/><rect x="5" y="12" width="8" height="2" rx=".5" fill="#4285F4" opacity=".4"/></svg>`,
  'gcp-cloudrun': `<svg viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" rx="3" stroke="#4285F4" stroke-width="1.5" fill="none"/><path d="M8 12l3 3 5-6" stroke="#4285F4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
}

const k8sServiceIcons: Record<string, string> = {
  'k8s-namespace': `<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="#326CE5" stroke-width="1.5" fill="none"/><text x="12" y="16" fill="#326CE5" font-size="8" text-anchor="middle" font-weight="bold">NS</text></svg>`,
  'k8s-deploy': `<svg viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" rx="3" stroke="#326CE5" stroke-width="1.5" fill="none"/><rect x="7" y="7" width="10" height="10" rx="2" stroke="#326CE5" stroke-width="1.2" fill="none"/><rect x="9" y="9" width="6" height="6" rx="1" fill="#326CE5" opacity=".3"/></svg>`,
  'k8s-service': `<svg viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" rx="3" stroke="#326CE5" stroke-width="1.5" fill="none"/><path d="M4 12h16M12 4v16" stroke="#326CE5" stroke-width="1" opacity=".3"/><circle cx="12" cy="12" r="3" stroke="#326CE5" stroke-width="1.5" fill="none"/><text x="12" y="14" fill="#326CE5" font-size="5" text-anchor="middle" font-weight="bold">SVC</text></svg>`,
  'k8s-ingress': `<svg viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" rx="3" stroke="#326CE5" stroke-width="1.5" fill="none"/><path d="M7 12h10M12 7v10" stroke="#326CE5" stroke-width="1.5" stroke-linecap="round"/><path d="M16 8l3 4-3 4" stroke="#326CE5" stroke-width="1.2" fill="none"/><path d="M8 8l-3 4 3 4" stroke="#326CE5" stroke-width="1.2" fill="none"/></svg>`,
  'k8s-configmap': `<svg viewBox="0 0 24 24" fill="none"><rect x="4" y="3" width="16" height="18" rx="2" stroke="#326CE5" stroke-width="1.5" fill="none"/><path d="M7 7h10M7 11h10M7 15h8" stroke="#326CE5" stroke-width="1.2" stroke-linecap="round"/></svg>`,
  'k8s-secret': `<svg viewBox="0 0 24 24" fill="none"><path d="M12 3c-4 0-8 2-8 6v4l8 8 8-8V9c0-4-4-6-8-6z" stroke="#326CE5" stroke-width="1.5" fill="none"/><circle cx="12" cy="11" r="2" stroke="#326CE5" stroke-width="1.2" fill="none"/><path d="M12 13v3" stroke="#326CE5" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  'k8s-pvc': `<svg viewBox="0 0 24 24" fill="none"><rect x="5" y="3" width="14" height="18" rx="3" stroke="#326CE5" stroke-width="1.5" fill="none"/><rect x="8" y="8" width="8" height="8" rx="1.5" stroke="#326CE5" stroke-width="1.2" fill="none" opacity=".5"/></svg>`,
  'k8s-hpa': `<svg viewBox="0 0 24 24" fill="none"><rect x="4" y="5" width="7" height="6" rx="1" stroke="#326CE5" stroke-width="1.5" fill="none"/><rect x="13" y="13" width="7" height="6" rx="1" stroke="#326CE5" stroke-width="1.5" fill="none"/><path d="M7 11v8M17 5v8" stroke="#326CE5" stroke-width="1" opacity=".5"/><path d="M7 19l-3-3 3-3M17 11l3-3-3-3" stroke="#326CE5" stroke-width="1.2" fill="none"/></svg>`,
}

const vercelServiceIcons: Record<string, string> = {
  'vercel-project': `<svg viewBox="0 0 24 24" fill="none"><path d="M12 2L2 22h20L12 2z" stroke="#000" stroke-width="1.5" fill="none"/><text x="12" y="16" fill="#000" font-size="6" text-anchor="middle" font-weight="bold">P</text></svg>`,
  'vercel-deployment': `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#000" stroke-width="1.5" fill="none"/><path d="M12 7v5l3 3" stroke="#000" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  'vercel-domain': `<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="8" width="18" height="10" rx="2" stroke="#000" stroke-width="1.5" fill="none"/><text x="12" y="16" fill="#000" font-size="6" text-anchor="middle" font-weight="bold">.app</text></svg>`,
  'vercel-edge-function': `<svg viewBox="0 0 24 24" fill="none"><path d="M5 4l7 8-7 8" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M15 4l4 8-4 8" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
  'vercel-env': `<svg viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" rx="2" stroke="#000" stroke-width="1.5" fill="none"/><text x="12" y="15" fill="#000" font-size="6" text-anchor="middle" font-weight="bold">ENV</text></svg>`,
  'vercel-analytics': `<svg viewBox="0 0 24 24" fill="none"><rect x="4" y="10" width="4" height="8" rx="1" stroke="#000" stroke-width="1.2" fill="none"/><rect x="10" y="6" width="4" height="12" rx="1" stroke="#000" stroke-width="1.2" fill="none"/><rect x="16" y="12" width="4" height="6" rx="1" stroke="#000" stroke-width="1.2" fill="none"/></svg>`,
}

const supabaseServiceIcons: Record<string, string> = {
  'supabase-project': `<svg viewBox="0 0 24 24" fill="none"><path d="M14 2l-8 13h6l-2 7 8-13h-6l2-7z" stroke="#3ECF8E" stroke-width="1.5" fill="none"/></svg>`,
  'supabase-table': `<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2" stroke="#3ECF8E" stroke-width="1.5" fill="none"/><path d="M3 10h18M12 4v16" stroke="#3ECF8E" stroke-width="1" opacity=".5"/></svg>`,
  'supabase-auth': `<svg viewBox="0 0 24 24" fill="none"><path d="M12 3c-4 0-8 2-8 6v4l8 8 8-8V9c0-4-4-6-8-6z" stroke="#3ECF8E" stroke-width="1.5" fill="none"/><path d="M9 12l2 2 4-4" stroke="#3ECF8E" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
  'supabase-storage-bucket': `<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="3" stroke="#3ECF8E" stroke-width="1.5" fill="none"/><path d="M3 8h18" stroke="#3ECF8E" stroke-width="1" opacity=".4"/><rect x="8" y="12" width="8" height="2" rx=".5" fill="#3ECF8E" opacity=".5"/></svg>`,
  'supabase-edge-function': `<svg viewBox="0 0 24 24" fill="none"><path d="M5 4l6 8-6 8" stroke="#3ECF8E" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M14 20h5" stroke="#3ECF8E" stroke-width="1.5" stroke-linecap="round"/><path d="M11 12h8" stroke="#3ECF8E" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  'supabase-realtime': `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="#3ECF8E" stroke-width="1.5" fill="none"/><path d="M12 8v4l2 2" stroke="#3ECF8E" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  'supabase-storage': `<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="3" stroke="#3ECF8E" stroke-width="1.5" fill="none"/><path d="M3 8h18" stroke="#3ECF8E" stroke-width="1" opacity=".4"/><rect x="8" y="12" width="8" height="2" rx=".5" fill="#3ECF8E" opacity=".5"/></svg>`,
}

const renderServiceIcons: Record<string, string> = {
  'render-web-service': `<svg viewBox="0 0 24 24" fill="none"><rect x="5" y="4" width="14" height="16" rx="2" stroke="#46E3B7" stroke-width="1.5" fill="none"/><rect x="8" y="7" width="8" height="2" rx=".5" fill="#46E3B7" opacity=".5"/><rect x="8" y="11" width="5" height="2" rx=".5" fill="#46E3B7" opacity=".5"/><circle cx="17" cy="17" r="2" fill="#46E3B7" opacity=".6"/></svg>`,
  'render-static-site': `<svg viewBox="0 0 24 24" fill="none"><rect x="4" y="6" width="16" height="12" rx="2" stroke="#46E3B7" stroke-width="1.5" fill="none"/><path d="M4 10h16" stroke="#46E3B7" stroke-width="1" opacity=".4"/><text x="12" y="16" fill="#46E3B7" font-size="5" text-anchor="middle" font-weight="bold">HTML</text></svg>`,
  'render-cron-job': `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="#46E3B7" stroke-width="1.5" fill="none"/><path d="M12 7v5l3 3" stroke="#46E3B7" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  'render-background-worker': `<svg viewBox="0 0 24 24" fill="none"><rect x="6" y="3" width="12" height="18" rx="2" stroke="#46E3B7" stroke-width="1.5" fill="none"/><path d="M10 9l4 3-4 3" stroke="#46E3B7" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
  'render-postgres': `<svg viewBox="0 0 24 24" fill="none"><path d="M4 5c0-1.1 3.6-2 8-2s8 .9 8 2v14c0 1.1-3.6 2-8 2s-8-.9-8-2V5z" stroke="#46E3B7" stroke-width="1.5" fill="none"/><path d="M4 5c0 1.1 3.6 2 8 2s8-.9 8-2" stroke="#46E3B7" stroke-width="1" fill="none" opacity=".4"/><text x="12" y="14" fill="#46E3B7" font-size="5" text-anchor="middle" font-weight="bold">PG</text></svg>`,
  'render-redis': `<svg viewBox="0 0 24 24" fill="none"><path d="M4 5c0-1.1 3.6-2 8-2s8 .9 8 2v12c0 1.1-3.6 2-8 2s-8-.9-8-2V5z" stroke="#46E3B7" stroke-width="1.5" fill="none"/><text x="12" y="14" fill="#46E3B7" font-size="5" text-anchor="middle" font-weight="bold">R</text></svg>`,
  'render-env-group': `<svg viewBox="0 0 24 24" fill="none"><rect x="4" y="8" width="16" height="10" rx="2" stroke="#46E3B7" stroke-width="1.5" fill="none"/><text x="12" y="16" fill="#46E3B7" font-size="5" text-anchor="middle" font-weight="bold">.env</text></svg>`,
}

const allServiceIcons: Record<string, string> = {
  ...awsServiceIcons,
  ...azureServiceIcons,
  ...gcpServiceIcons,
  ...k8sServiceIcons,
  ...vercelServiceIcons,
  ...supabaseServiceIcons,
  ...renderServiceIcons,
}

export function getProviderLogo(provider: string): string {
  return providerLogos[provider] || ''
}

export function getServiceIcon(componentId: string): string {
  return allServiceIcons[componentId] || ''
}

export function hasServiceIcon(componentId: string): boolean {
  return !!allServiceIcons[componentId]
}

export function ProviderLogo({ provider, size = 20 }: { provider: string; size?: number }) {
  const svg = getProviderLogo(provider)
  if (!svg) return null
  return <span style={{ width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} dangerouslySetInnerHTML={{ __html: svg.replace('width="24"', `width="${size}"`).replace('height="24"', `height="${size}"`) }} />
}

export function ServiceIcon({ componentId, size = 20 }: { componentId: string; size?: number }) {
  const svg = getServiceIcon(componentId)
  if (!svg) return null
  return <span style={{ width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} dangerouslySetInnerHTML={{ __html: svg.replace('viewBox="0 0 24 24"', `viewBox="0 0 24 24" style="width:${size}px;height:${size}px"`) }} />
}

export function getProviderColor(provider: string): string {
  const colors: Record<string, string> = {
    aws: '#FF9900',
    azure: '#0078D4',
    gcp: '#4285F4',
    k8s: '#326CE5',
    vercel: '#000000',
    supabase: '#3ECF8E',
    render: '#46E3B7',
  }
  return colors[provider] || '#6b7280'
}
