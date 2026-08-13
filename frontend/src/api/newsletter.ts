/**
 * Newsletter API Client
 * Integração com Plunk (transactional + marketing emails)
 */

const PLUNK_API_KEY = import.meta.env.VITE_PLUNK_API_KEY || '';
const PLUNK_API_URL = 'https://api.useplunk.com/v1';

export interface Subscriber {
  email: string;
  name?: string;
  source: string;
}

export interface NewsletterCampaign {
  id: string;
  subject: string;
  body: string;
  status: 'draft' | 'scheduled' | 'sent';
  sentAt?: string;
  stats?: {
    sent: number;
    opened: number;
    clicked: number;
  };
}

/**
 * Adiciona um inscrito à newsletter
 */
export async function subscribe(data: Subscriber): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${PLUNK_API_URL}/subscribers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PLUNK_API_KEY}`,
      },
      body: JSON.stringify({
        email: data.email,
        data: {
          name: data.name,
          source: data.source,
          subscribed_at: new Date().toISOString(),
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to subscribe');
    }

    return { success: true, message: 'Inscrito com sucesso!' };
  } catch (error) {
    console.error('Newsletter subscribe error:', error);
    return { success: false, message: 'Erro ao inscrever. Tente novamente.' };
  }
}

/**
 * Remove um inscrito da newsletter
 */
export async function unsubscribe(email: string): Promise<{ success: boolean }> {
  try {
    const response = await fetch(`${PLUNK_API_URL}/subscribers/${encodeURIComponent(email)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${PLUNK_API_KEY}`,
      },
    });

    return { success: response.ok };
  } catch {
    return { success: false };
  }
}

/**
 * Envia email transacional (welcome, reset password, etc.)
 */
export async function sendTransactionalEmail(params: {
  to: string;
  subject: string;
  body: string;
  replyTo?: string;
}): Promise<boolean> {
  try {
    const response = await fetch(`${PLUNK_API_URL}/emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PLUNK_API_KEY}`,
      },
      body: JSON.stringify({
        to: params.to,
        subject: params.subject,
        body: params.body,
        from: 'CloudBuilder <noreply@cloudbuilder.com>',
        replyTo: params.replyTo,
      }),
    });

    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Envia welcome email para novo inscrito
 */
/**
 * Alias used by LandingPage
 */
export const subscribeToNewsletter = subscribe;

export async function sendWelcomeEmail(email: string, name?: string): Promise<boolean> {
  const displayName = name || 'Developer';
  return sendTransactionalEmail({
    to: email,
    subject: 'Bem-vindo ao CloudBuilder Weekly! 🚀',
    body: `
      <h2>Olá, ${displayName}!</h2>
      <p>Bem-vindo ao <strong>CloudBuilder Weekly</strong>, nossa newsletter semanal sobre Platform Engineering e FinOps.</p>
      <p>Toda terça-feira, você receberá:</p>
      <ul>
        <li>🎯 1 destaque técnico</li>
        <li>🔗 5 links úteis</li>
        <li>💡 1 dica rápida</li>
        <li>📦 Novidades do produto</li>
        <li>👥 Destaque da comunidade</li>
      </ul>
      <p>Enquanto isso, confira nosso blog:</p>
      <p><a href="https://cloudbuilder.com/blog">https://cloudbuilder.com/blog</a></p>
      <p>Equipe CloudBuilder</p>
    `,
  });
}
