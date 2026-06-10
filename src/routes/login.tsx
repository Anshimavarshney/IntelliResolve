import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useMemo, useEffect } from 'react';
import { useStore } from '@/lib/store-context';
import type { UserRole } from '@/lib/supabase-store';
import { ThemeProvider, useTheme } from '@/components/ThemeProvider';
import { Brain, CheckCircle, Loader2, Sun, Moon, ArrowLeft, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>): { tab?: string } => ({
    tab: search.tab as string | undefined,
  }),
  component: LoginRoute,
  head: () => ({
    meta: [
      { title: 'Sign In — IntelliResolve' },
      { name: 'description', content: 'Sign in or create an account to access IntelliResolve complaint management.' },
    ],
  }),
});

function LoginRoute() {
  return (
    <ThemeProvider>
      <LoginPageInner />
    </ThemeProvider>
  );
}

function LoginPageInner() {
  const store = useStore();
  const navigate = useNavigate();
  const { tab } = Route.useSearch();
  const { theme, toggle } = useTheme();

  const [isSignup, setIsSignup] = useState(tab === 'signup' || false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [institutionSearch, setInstitutionSearch] = useState('');
  const [showInstitutions, setShowInstitutions] = useState(false);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState('');
  const [selectedInstitutionName, setSelectedInstitutionName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (store.currentUser) {
      navigate({ to: '/dashboard' });
    }
  }, [store.currentUser, navigate]);

  const filteredInstitutions = useMemo(() => {
    if (!institutionSearch) return store.institutions.slice(0, 20);
    const q = institutionSearch.toLowerCase();
    return store.institutions.filter(i => i.name.toLowerCase().includes(q) || (i.state || '').toLowerCase().includes(q)).slice(0, 20);
  }, [institutionSearch, store.institutions]);

  if (store.authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      setError(error.message);
    } else {
      setResetSent(true);
    }
    setSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (isSignup) {
      if (role === 'student' && !rollNumber.trim()) {
        setError('Roll number / enrollment number is required for student verification.');
        setSubmitting(false);
        return;
      }
      const result = await store.signup(email, password, name, role, selectedInstitutionId || undefined);
      if (result.error) {
        setError(result.error);
      } else {
        setSignupSuccess(true);
      }
    } else {
      const result = await store.login(email, password);
      if (result.error) {
        setError(result.error);
      }
    }
    setSubmitting(false);
  };

  if (signupSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md text-center">
          <div className="h-16 w-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-success" />
          </div>
          <h2 className="text-xl font-bold mb-2">Account Created!</h2>
          <p className="text-sm text-muted-foreground mb-4">Check your email to verify your account, then sign in.</p>
          <button onClick={() => { setSignupSuccess(false); setIsSignup(false); }} className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (resetSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md text-center">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold mb-2">Reset Email Sent</h2>
          <p className="text-sm text-muted-foreground mb-4">Check your email for a password reset link.</p>
          <button onClick={() => { setResetSent(false); setIsForgotPassword(false); }} className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <button onClick={toggle} className="p-2 rounded-lg hover:bg-accent transition-colors">
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Brain className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">IntelliResolve</h1>
          <p className="text-muted-foreground text-xs mt-1">AI-Driven E-Complaint Management</p>
        </div>

        <div className="bg-card rounded-2xl border shadow-lg p-6">
          {isForgotPassword ? (
            <>
              <h2 className="text-lg font-semibold mb-1">Reset Password</h2>
              <p className="text-xs text-muted-foreground mb-4">Enter your email to receive a password reset link.</p>
              {error && <div className="bg-destructive/10 text-destructive text-sm rounded-lg px-4 py-2.5 mb-4">{error}</div>}
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email</label>
                  <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@institution.edu" className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" required />
                </div>
                <button type="submit" disabled={submitting} className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Send Reset Link
                </button>
                <button type="button" onClick={() => setIsForgotPassword(false)} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
                  ← Back to Login
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="flex mb-6 bg-muted rounded-lg p-1">
                <button onClick={() => setIsSignup(false)} className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${!isSignup ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}>Login</button>
                <button onClick={() => setIsSignup(true)} className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${isSignup ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}>Sign Up</button>
              </div>

              {error && <div className="bg-destructive/10 text-destructive text-sm rounded-lg px-4 py-2.5 mb-4 animate-in fade-in">{error}</div>}

              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignup && (
                  <>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Full Name</label>
                      <input value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name" className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" required />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                        Roll No. / Enrollment No. <span className="text-destructive">*</span>
                      </label>
                      <input value={rollNumber} onChange={e => setRollNumber(e.target.value)} placeholder="e.g. 2024UGCS001" className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" required />
                      <p className="text-[10px] text-muted-foreground mt-1">Required for student identity verification</p>
                    </div>
                    <div className="relative">
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Institution</label>
                      <div className="relative">
                        <input
                          value={institutionSearch || selectedInstitutionName}
                          onChange={e => { setInstitutionSearch(e.target.value); setSelectedInstitutionId(''); setSelectedInstitutionName(''); setShowInstitutions(true); }}
                          onFocus={() => setShowInstitutions(true)}
                          placeholder="Search 140+ institutions..."
                          className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        />
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
                      {showInstitutions && filteredInstitutions.length > 0 && (
                        <div className="absolute z-20 w-full mt-1 bg-popover border rounded-lg shadow-xl max-h-48 overflow-y-auto">
                          {filteredInstitutions.map(inst => (
                            <button key={inst.id} type="button" onClick={() => { setSelectedInstitutionId(inst.id); setSelectedInstitutionName(inst.name); setInstitutionSearch(''); setShowInstitutions(false); }}
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors">
                              <span className="font-medium">{inst.name}</span>
                              <span className="text-xs text-muted-foreground ml-2">{inst.state} · {inst.type}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email</label>
                  <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@institution.edu" className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" required />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Password</label>
                  <div className="relative">
                    <input value={password} onChange={e => setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} placeholder="Min 6 characters" className="w-full px-4 py-2.5 pr-10 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" required minLength={6} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                {isSignup && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Role</label>
                    <select value={role} onChange={e => setRole(e.target.value as UserRole)} className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all">
                      <option value="student">Student</option>
                      <option value="staff">Department Staff</option>
                      <option value="admin">Admin</option>
                      <option value="superadmin">Super Admin</option>
                    </select>
                  </div>
                )}
                <button type="submit" disabled={submitting} className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isSignup ? 'Create Account' : 'Sign In'}
                </button>
                {!isSignup && (
                  <button type="button" onClick={() => setIsForgotPassword(true)} className="w-full text-xs text-muted-foreground hover:text-primary transition-colors">
                    Forgot your password?
                  </button>
                )}
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Supporting {store.institutions.length}+ institutions across India
        </p>
      </div>
    </div>
  );
}
