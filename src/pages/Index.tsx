import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, ArrowRight } from 'lucide-react';
import { FuturisticButton } from '@/components/ui/futuristic-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/ui/logo';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already authenticated
    const authData = sessionStorage.getItem('auth');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        if (parsed?.isAuthenticated) {
          if (parsed.userType === 'admin') {
            navigate('/admin/dashboard', { replace: true });
          } else {
            navigate('/user/dashboard', { replace: true });
          }
        }
      } catch (e) {
        sessionStorage.removeItem('auth');
      }
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-primary/5 to-accent/5 rounded-full blur-3xl animate-glow" />
      </div>

      <div className="relative z-10 w-full max-w-4xl mx-auto animate-fade-in">
        {/* Hero Section */}
        <div className="text-center space-y-8 mb-12">
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-3xl flex items-center justify-center shadow-lg mb-4">
                  <button
                    type="button"
                    aria-label="Open login"
                    className="focus-ring rounded-2xl outline-none flex items-center justify-center w-16 h-16"
                    onClick={() => navigate('/login')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate('/login');
                      }
                    }}
                  >
                    <Logo imgClassName="w-10 h-10 text-primary-foreground" />
                    <span className="sr-only">FGCK LWANDA CDC HUB</span>
                  </button>
                </div>
                <div className="absolute -inset-2 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl blur animate-pulse-glow -z-10" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gradient mb-4">
              FGCK LWANDA CDC HUB
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Secure data management with compassion at heart
            </p>
            <p className="text-lg text-muted-foreground/80 max-w-xl mx-auto">
              A modern, interactive platform for managing user information with different access levels for administrators and users.
            </p>
          </div>

          <FuturisticButton
            variant="futuristic"
            size="xl"
            onClick={() => navigate('/login')}
            className="group"
          >
            <span>Get Started</span>
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </FuturisticButton>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="card-futuristic interactive-scale">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-glow rounded-2xl flex items-center justify-center">
                  <Users className="w-8 h-8 text-primary-foreground" />
                </div>
              </div>
              <CardTitle className="text-xl">User Portal</CardTitle>
              <CardDescription>
                Secure access for users to view their personal information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                  <span>Read-only access to personal data</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                  <span>Organized information categories</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                  <span>Mobile-friendly interface</span>
                </li>
              </ul>
              <FuturisticButton
                variant="outline"
                className="w-full"
                onClick={() => navigate('/login')}
              >
                Access User Portal
              </FuturisticButton>
            </CardContent>
          </Card>

          <Card className="card-futuristic interactive-scale">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-accent to-accent rounded-2xl flex items-center justify-center">
                  <Shield className="w-8 h-8 text-accent-foreground" />
                </div>
              </div>
              <CardTitle className="text-xl">Admin Dashboard</CardTitle>
              <CardDescription>
                Comprehensive management tools for administrators
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-accent rounded-full" />
                  <span>Full CRUD operations on user data</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-accent rounded-full" />
                  <span>User management and access control</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-accent rounded-full" />
                  <span>System settings and configuration</span>
                </li>
              </ul>
              <FuturisticButton
                variant="outline"
                className="w-full"
                onClick={() => navigate('/login')}
              >
                Access Admin Dashboard
              </FuturisticButton>
            </CardContent>
          </Card>
        </div>

        {/* Security Notice */}
        <div className="mt-12 text-center">
          <Card className="bg-muted/20 border-border/30 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Shield className="w-5 h-5 text-primary" />
                <span className="font-semibold text-primary">Secure & Private</span>
              </div>
              <p className="text-sm text-muted-foreground">
                All data is securely encrypted and access is strictly controlled based on user roles and permissions.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
