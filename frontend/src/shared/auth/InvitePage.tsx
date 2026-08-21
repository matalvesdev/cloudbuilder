import { useState, FormEvent, useMemo, useEffect } from "react";
import {
  Cloud,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Check,
  CheckCircle2,
  XCircle,
  Mail,
  Shield,
  User,
  Code2,
  Clock,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";

interface InvitePageProps {
  token: string;
  onSwitchToLogin: () => void;
}

function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>/?]/.test(password)) score++;

  if (score <= 2) return { score, label: "Fraca", color: "bg-red-500" };
  if (score <= 4) return { score, label: "Média", color: "bg-amber-500" };
  return { score, label: "Forte", color: "bg-green-500" };
}

function PasswordRequirement({ met, label }: { met: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      {met ? (
        <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
      ) : (
        <XCircle className="w-3 h-3 text-slate-300 shrink-0" />
      )}
      <span
        className={`text-[10px] ${met ? "text-green-600" : "text-slate-400"}`}
      >
        {label}
      </span>
    </div>
  );
}

export function InvitePage({ token, onSwitchToLogin }: InvitePageProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [inviteValid, setInviteValid] = useState<boolean | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("");

  const { register, error: authError } = useAuthStore();

  const passwordStrength = useMemo(
    () => getPasswordStrength(password),
    [password],
  );

  const passwordChecks = useMemo(
    () => ({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>/?]/.test(password),
    }),
    [password],
  );

  const displayError = validationError || authError;

  // Validate invitation token on mount
  useEffect(() => {
    // In a real app, we'd call GET /api/v1/invitations/validate?token=xxx
    // For now, accept any non-empty token
    if (token && token.length > 10) {
      setInviteValid(true);
      // Pre-fill email from token (in production, fetched from API)
      setEmail("");
      setInviteRole("editor");
    } else {
      setInviteValid(false);
    }
  }, [token]);

  const roleLabels: Record<string, { label: string; icon: typeof Shield; desc: string }> = {
    admin: { label: "Administrador", icon: Shield, desc: "Acesso total" },
    editor: { label: "Editor", icon: Code2, desc: "Leitura + escrita" },
    viewer: { label: "Visualizador", icon: User, desc: "Somente leitura" },
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!name.trim() || !email.trim() || !password.trim()) {
      setValidationError("Preencha todos os campos obrigatórios.");
      return;
    }

    if (name.trim().length < 2) {
      setValidationError("O nome deve ter pelo menos 2 caracteres.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setValidationError("Digite um e-mail válido.");
      return;
    }

    if (password.length < 8) {
      setValidationError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (
      !passwordChecks.uppercase ||
      !passwordChecks.lowercase ||
      !passwordChecks.number ||
      !passwordChecks.special
    ) {
      setValidationError(
        "A senha deve conter maiúscula, minúscula, número e caractere especial.",
      );
      return;
    }

    if (password !== confirmPassword) {
      setValidationError("As senhas não coincidem.");
      return;
    }

    if (!acceptedTerms) {
      setValidationError(
        "Você precisa aceitar os Termos de Uso e a Política de Privacidade.",
      );
      return;
    }

    setIsLoading(true);
    try {
      // Register with the invited role
      // In production, the backend would validate the token and assign the role
      await register(
        name.trim(),
        email.trim(),
        password,
        undefined, // orgName — will be assigned from invitation
        undefined, // tenantSlug — will be assigned from invitation
        inviteRole || "editor",
      );
    } catch {
      // Error is already set in authStore
    } finally {
      setIsLoading(false);
    }
  };

  // Invalid token state
  if (inviteValid === false) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-lg font-display font-bold text-brand-navy mb-2">
              Convite inválido
            </h2>
            <p className="text-sm text-slate-400 mb-6">
              Este link de convite é inválido ou expirou. Solicite um novo
              convite ao administrador da organização.
            </p>
            <button
              onClick={onSwitchToLogin}
              className="w-full h-11 rounded-xl bg-brand-navy text-white font-bold text-sm hover:bg-brand-navy/90 transition-all"
            >
              Ir para o login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state while validating token
  if (inviteValid === null) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-brand-navy animate-spin" />
      </div>
    );
  }

  const roleInfo = roleLabels[inviteRole] || roleLabels.editor;
  const RoleIcon = roleInfo.icon;

  return (
    <div className="h-screen w-screen flex bg-slate-50">
      {/* Left - Brand panel */}
      <div className="hidden lg:flex w-1/2 bg-brand-navy relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-brand-lime blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-ice-blue blur-3xl" />
        </div>
        <div className="relative z-10 text-center max-w-md px-8">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-6 ring-1 ring-white/20">
            <Cloud className="h-8 w-8 text-brand-lime" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white mb-3">
            CloudBuilder
          </h1>
          <p className="text-base text-slate-300 leading-relaxed">
            Você foi convidado para participar de uma organização no
            CloudBuilder. Crie sua conta para começar.
          </p>
          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-slate-400">
            <span>Design Visual</span>
            <span className="w-1 h-1 rounded-full bg-slate-600" />
            <span>Provisionamento</span>
            <span className="w-1 h-1 rounded-full bg-slate-600" />
            <span>Observabilidade</span>
          </div>
        </div>
      </div>

      {/* Right - Invite form */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-sm py-8">
          <div className="text-center mb-8 lg:hidden">
            <div className="w-12 h-12 rounded-xl bg-brand-navy flex items-center justify-center mx-auto mb-4">
              <Cloud className="h-6 w-6 text-brand-lime" />
            </div>
            <h1 className="text-xl font-display font-bold text-brand-navy">
              CloudBuilder
            </h1>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            {/* Invitation badge */}
            <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-brand-lime/10 border border-brand-lime/20">
              <Mail className="w-5 h-5 text-brand-navy shrink-0" />
              <div>
                <p className="text-xs font-bold text-brand-navy">
                  Você foi convidado!
                </p>
                <p className="text-[10px] text-slate-500">
                  Role: {roleInfo.label} — {roleInfo.desc}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-display font-bold text-brand-navy">
                Criar sua conta
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Preencha seus dados para aceitar o convite
              </p>
            </div>

            {displayError && (
              <div className="mb-4 flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-100 text-sm">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span className="text-red-700">{displayError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Nome completo <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy outline-none transition-all placeholder:text-slate-300"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy outline-none transition-all placeholder:text-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Senha <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full h-10 px-3.5 pr-10 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy outline-none transition-all placeholder:text-slate-300"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Password strength bar */}
                {password.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color}`}
                          style={{
                            width: `${(passwordStrength.score / 6) * 100}%`,
                          }}
                        />
                      </div>
                      <span
                        className={`text-[10px] font-bold ${
                          passwordStrength.score <= 2
                            ? "text-red-500"
                            : passwordStrength.score <= 4
                              ? "text-amber-500"
                              : "text-green-500"
                        }`}
                      >
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      <PasswordRequirement
                        met={passwordChecks.length}
                        label="8+ caracteres"
                      />
                      <PasswordRequirement
                        met={passwordChecks.uppercase}
                        label="Letra maiúscula"
                      />
                      <PasswordRequirement
                        met={passwordChecks.lowercase}
                        label="Letra minúscula"
                      />
                      <PasswordRequirement
                        met={passwordChecks.number}
                        label="Número"
                      />
                      <PasswordRequirement
                        met={passwordChecks.special}
                        label="Caractere especial"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Confirmar senha <span className="text-red-400">*</span>
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a senha"
                  className={`w-full h-10 px-3.5 rounded-xl border text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy outline-none transition-all placeholder:text-slate-300 ${
                    confirmPassword && password !== confirmPassword
                      ? "border-red-300 bg-red-50/50"
                      : confirmPassword && password === confirmPassword
                        ? "border-green-300 bg-green-50/50"
                        : "border-slate-200"
                  }`}
                  required
                  minLength={8}
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-[10px] text-red-500 mt-1">
                    As senhas não coincidem
                  </p>
                )}
                {confirmPassword &&
                  password === confirmPassword &&
                  confirmPassword.length >= 8 && (
                    <p className="text-[10px] text-green-600 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Senhas coincidem
                    </p>
                  )}
              </div>

              {/* Role display (read-only from invitation) */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                  Sua role na organização
                </label>
                <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="w-10 h-10 rounded-xl bg-brand-navy/10 flex items-center justify-center">
                    <RoleIcon className="w-5 h-5 text-brand-navy" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-brand-navy">
                      {roleInfo.label}
                    </p>
                    <p className="text-[10px] text-slate-400">{roleInfo.desc}</p>
                  </div>
                </div>
              </div>

              {/* Terms of Service */}
              <div className="flex items-start gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="terms"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-brand-navy focus:ring-brand-navy/20 cursor-pointer"
                />
                <label
                  htmlFor="terms"
                  className="text-xs text-slate-500 leading-relaxed cursor-pointer"
                >
                  Li e aceito os{" "}
                  <span className="text-brand-navy font-semibold hover:underline">
                    Termos de Uso
                  </span>{" "}
                  e a{" "}
                  <span className="text-brand-navy font-semibold hover:underline">
                    Política de Privacidade
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={
                  isLoading ||
                  !name.trim() ||
                  !email.trim() ||
                  !password.trim() ||
                  !confirmPassword.trim() ||
                  !acceptedTerms
                }
                className="w-full h-11 rounded-xl bg-brand-navy text-white font-bold text-sm hover:bg-brand-navy/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Aceitar convite e criar conta
                  </>
                )}
              </button>
            </form>

            <div className="mt-4 text-center">
              <span className="text-xs text-slate-400">
                Já tem uma conta?{" "}
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="text-brand-navy font-semibold hover:underline"
                >
                  Fazer login
                </button>
              </span>
            </div>
          </div>

          {/* Expiry notice */}
          <div className="flex items-center justify-center gap-1.5 mt-4 text-[11px] text-slate-400">
            <Clock className="w-3 h-3" />
            Este convite expira em 7 dias
          </div>

          <p className="text-center text-xs text-slate-400 mt-2">
            CloudBuilder v1.0 — Platform Engineering Platform
          </p>
        </div>
      </div>
    </div>
  );
}
