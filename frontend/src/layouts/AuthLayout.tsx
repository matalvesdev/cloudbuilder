import { LoginPage } from '@/shared/auth/LoginPage'
import { RegisterPage } from '@/shared/auth/RegisterPage'
import { ForgotPasswordPage } from '@/shared/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/shared/auth/ResetPasswordPage'

interface AuthLayoutProps {
  mode: 'login' | 'register' | 'forgot-password' | 'reset-password'
  resetToken?: string | null
  onSwitch: (mode: 'login' | 'register' | 'forgot-password' | 'reset-password') => void
}

export function AuthLayout({ mode, resetToken, onSwitch }: AuthLayoutProps) {
  if (mode === 'register') {
    return <RegisterPage onSwitchToLogin={() => onSwitch('login')} />
  }
  if (mode === 'forgot-password') {
    return <ForgotPasswordPage onSwitchToLogin={() => onSwitch('login')} />
  }
  if (mode === 'reset-password' && resetToken) {
    return <ResetPasswordPage token={resetToken} onSwitchToLogin={() => onSwitch('login')} />
  }
  return (
    <LoginPage
      onSwitchToRegister={() => onSwitch('register')}
      onSwitchToForgotPassword={() => onSwitch('forgot-password')}
    />
  )
}
