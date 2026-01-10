import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { LoginForm } from '@/components/auth/LoginForm';
import { FuturisticButton } from '@/components/ui/futuristic-button';
import { Shield, Users, ArrowRight } from 'lucide-react';
import { LoginType } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const [loginType, setLoginType] = useState<LoginType>('user');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (credentials: { email?: string; fullName?: string; childNumber?: string; password: string }) => {
    setIsLoading(true);
    setError('');

    try {
      if (loginType === 'admin') {
        // Admin login using email/password
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: credentials.email!,
          password: credentials.password,
        });

        if (authError) {
          if (authError.message.includes('Email not confirmed')) {
            setError('Please verify your email address. Check your inbox for the confirmation link.');
          } else if (authError.message.includes('Invalid login credentials')) {
            setError('Invalid email or password. Please check your credentials.');
          } else {
            setError(authError.message || 'Invalid email or password. Please check your credentials.');
          }
          return;
        }

        // Fetch admin data
        const { data: adminData, error: adminError } = await supabase
          .from('admins')
          .select('*')
          .eq('user_id', authData.user.id)
          .single();

        if (adminError || !adminData) {
          try { await supabase.auth.signOut({ scope: 'local' }); } catch {}
          setError('Admin account not found. Please contact support.');
          return;
        }

        toast({
          title: "Welcome back!",
          description: `Logged in as ${adminData.full_name}`,
        });
        
        navigate('/admin/dashboard');
      } else {
        // User login using email/password and verify child number
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: credentials.email!,
          password: credentials.password,
        });

        if (authError) {
          if (authError.message.includes('Email not confirmed')) {
            setError('Please verify your email address. Check your inbox for the confirmation link.');
          } else if (authError.message.includes('Invalid login credentials')) {
            setError('Invalid email or password. Please check your credentials.');
          } else {
            setError(authError.message || 'Invalid email or password. Please check your credentials.');
          }
          return;
        }

        // Fetch user profile data and verify child number
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', authData.user.id)
          .single();

        if (profileError || !profileData) {
          try { await supabase.auth.signOut({ scope: 'local' }); } catch {}
          setError('User profile not found. Please contact support.');
          return;
        }

        // Verify child number matches
        if (profileData.child_number !== credentials.childNumber) {
          try { await supabase.auth.signOut({ scope: 'local' }); } catch {}
          setError('Invalid child number. Please check your credentials.');
          return;
        }

        if (!profileData.is_active) {
          try { await supabase.auth.signOut({ scope: 'local' }); } catch {}
          setError('Your account is currently disabled. Please contact the administrator for assistance.');
          return;
        }

        toast({
          title: "Welcome!",
          description: `Hello ${profileData.full_name}`,
        });
        
        navigate('/user/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-primary/5 to-accent/5 rounded-full blur-3xl animate-glow" />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-8 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <h1 className="text-4xl font-bold text-gradient mb-2">
                FGCK LWANDA CDC HUB
              </h1>
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 blur rounded-lg -z-10" />
            </div>
          </div>
          <p className="text-muted-foreground text-lg">
            Secure data management with compassion at heart
          </p>
        </div>

        {/* Login Type Toggle */}
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground mb-3">
              Choose your access level
            </p>
          </div>
          
          <ToggleGroup
            type="single"
            value={loginType}
            onValueChange={(value) => value && setLoginType(value as LoginType)}
            className="grid grid-cols-2 gap-2 p-1 bg-muted/50 rounded-xl backdrop-blur-sm"
          >
            <ToggleGroupItem
              value="user"
              className={`relative flex flex-col items-center space-y-2 p-4 rounded-lg transition-all duration-300 ${
                loginType === 'user'
                  ? 'bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-lg'
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <Users className="w-6 h-6" />
              <span className="font-medium">User Portal</span>
              {loginType === 'user' && (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary-glow/20 rounded-lg blur animate-pulse-glow -z-10" />
              )}
            </ToggleGroupItem>
            
            <ToggleGroupItem
              value="admin"
              className={`relative flex flex-col items-center space-y-2 p-4 rounded-lg transition-all duration-300 ${
                loginType === 'admin'
                  ? 'bg-gradient-to-br from-accent to-accent text-accent-foreground shadow-lg'
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <Shield className="w-6 h-6" />
              <span className="font-medium">Admin Access</span>
              {loginType === 'admin' && (
                <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-accent/30 rounded-lg blur animate-pulse-glow -z-10" />
              )}
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Login Form */}
        <div className="animate-slide-in-right">
          <LoginForm
            loginType={loginType}
            onLogin={handleLogin}
            error={error}
            isLoading={isLoading}
          />
        </div>

        {/* Demo Credentials */}
        <div className="bg-muted/20 border border-border/50 rounded-xl p-4 backdrop-blur-sm animate-fade-in">
          <h3 className="font-semibold text-sm mb-3 text-center text-muted-foreground">
            Demo Credentials
          </h3>
          <div className="space-y-3 text-xs">
            {loginType === 'admin' ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-accent/10 rounded-lg">
                  <span className="font-medium">Super Admin:</span>
                  <span className="font-mono">admin@compassionsafe.org</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-primary/10 rounded-lg">
                  <span className="font-medium">Password:</span>
                  <span className="font-mono">AdminPass123!</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-success/10 rounded-lg">
                  <span className="font-medium">Email:</span>
                  <span className="font-mono">user@example.com</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-success/10 rounded-lg">
                  <span className="font-medium">Child Number:</span>
                  <span className="font-mono">CS001</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-success/10 rounded-lg">
                  <span className="font-medium">Password:</span>
                  <span className="font-mono">UserPass123!</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
