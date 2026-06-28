import { forwardRef, useEffect, useState } from 'react';
import type { InputHTMLAttributes } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { BranchDto, UserRole } from '@inventarioapp/shared';
import { authApi } from '../api/client';
import { useAuthStore } from '../context/auth-store';

interface LoginForm {
  email: string;
  password: string;
}

interface RegisterForm extends LoginForm {
  fullName: string;
  role: typeof UserRole.ADMIN | typeof UserRole.ENCARGADO;
  branchId: string;
  invitationCode: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [loading, setLoading] = useState(false);

  const loginForm = useForm<LoginForm>();
  const registerForm = useForm<RegisterForm>({
    defaultValues: { role: UserRole.ENCARGADO },
  });
  const registerRole = registerForm.watch('role');

  useEffect(() => {
    if (mode !== 'register' || branches.length) return;
    authApi
      .registrationBranches()
      .then((res) => setBranches(res.data?.data ?? res.data ?? []))
      .catch(() => toast.error('Error al cargar sucursales'));
  }, [mode, branches.length]);

  const onLogin = async (data: LoginForm) => {
    setLoading(true);
    try {
      const response = await authApi.login(data.email, data.password);
      const { accessToken, user } = response.data.data ?? response.data;
      login(accessToken, user);
      toast.success(`¡Bienvenido, ${user.fullName}!`);
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (data: RegisterForm) => {
    setLoading(true);
    try {
      await authApi.register({
        ...data,
        branchId: data.branchId || undefined,
      });
      toast.success('Usuario registrado. Ya puedes iniciar sesión.');
      setMode('login');
      loginForm.setValue('email', data.email);
      registerForm.reset({ role: UserRole.ENCARGADO });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al registrar usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-lg)',
        background: 'var(--color-bg)',
      }}
    >
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
          <div style={{ fontSize: '48px', marginBottom: 'var(--space-md)' }}>🍔</div>
          <h1
            style={{
              fontSize: 'var(--font-size-3xl)',
              fontWeight: 800,
              color: 'var(--color-primary)',
              letterSpacing: '-0.03em',
            }}
          >
            FATBOY
          </h1>
          <p
            style={{
              color: 'var(--color-text-secondary)',
              fontSize: 'var(--font-size-sm)',
              marginTop: 'var(--space-xs)',
            }}
          >
            Sistema de Inventario
          </p>
        </div>

        {mode === 'login' ? (
          <form
            onSubmit={loginForm.handleSubmit(onLogin)}
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}
          >
            <TextInput
              id="email"
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="tu@email.com"
              error={loginForm.formState.errors.email?.message}
              {...loginForm.register('email', {
                required: 'El email es requerido',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Email inválido',
                },
              })}
            />
            <TextInput
              id="password"
              label="Contraseña"
              type="password"
              autoComplete="current-password"
              placeholder="••••••"
              error={loginForm.formState.errors.password?.message}
              {...loginForm.register('password', {
                required: 'La contraseña es requerida',
              })}
            />
            <button
              type="submit"
              className="btn btn--primary btn--lg"
              disabled={loading}
              style={{ marginTop: 'var(--space-sm)' }}
            >
              {loading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : 'Entrar'}
            </button>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => setMode('register')}
            >
              Registrar nuevo usuario
            </button>
          </form>
        ) : (
          <form
            onSubmit={registerForm.handleSubmit(onRegister)}
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}
          >
            <TextInput
              id="registerFullName"
              label="Nombre completo"
              error={registerForm.formState.errors.fullName?.message}
              {...registerForm.register('fullName', {
                required: 'El nombre es requerido',
              })}
            />
            <TextInput
              id="registerEmail"
              label="Email"
              type="email"
              autoComplete="email"
              error={registerForm.formState.errors.email?.message}
              {...registerForm.register('email', {
                required: 'El email es requerido',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Email inválido',
                },
              })}
            />
            <TextInput
              id="registerPassword"
              label="Contraseña"
              type="password"
              autoComplete="new-password"
              error={registerForm.formState.errors.password?.message}
              {...registerForm.register('password', {
                required: 'La contraseña es requerida',
                minLength: { value: 6, message: 'Mínimo 6 caracteres' },
              })}
            />
            <div className="form-group">
              <label className="form-label">Rol</label>
              <select className="form-select" {...registerForm.register('role')}>
                <option value={UserRole.ENCARGADO}>Encargado</option>
                <option value={UserRole.ADMIN}>Administrador</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Sucursal</label>
              <select
                className={`form-select ${registerForm.formState.errors.branchId ? 'form-input--error' : ''}`}
                {...registerForm.register('branchId', {
                  validate: (value) =>
                    registerRole !== UserRole.ENCARGADO || !!value || 'La sucursal es requerida',
                })}
              >
                <option value="">Sin asignar</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
              {registerForm.formState.errors.branchId && (
                <span className="form-error">{registerForm.formState.errors.branchId.message}</span>
              )}
            </div>
            <TextInput
              id="invitationCode"
              label="Código de invitación"
              error={registerForm.formState.errors.invitationCode?.message}
              {...registerForm.register('invitationCode', {
                required: 'El código es requerido',
              })}
            />
            <button
              type="submit"
              className="btn btn--primary btn--lg"
              disabled={loading}
              style={{ marginTop: 'var(--space-sm)' }}
            >
              {loading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : 'Registrarme'}
            </button>
            <button type="button" className="btn btn--secondary" onClick={() => setMode('login')}>
              Ya tengo cuenta
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
}>(({ label, error, ...props }, ref) => {
  return (
    <div className="form-group">
      <label htmlFor={props.id} className="form-label">
        {label}
      </label>
      <input ref={ref} className={`form-input ${error ? 'form-input--error' : ''}`} {...props} />
      {error && <span className="form-error">{error}</span>}
    </div>
  );
});

TextInput.displayName = 'TextInput';
