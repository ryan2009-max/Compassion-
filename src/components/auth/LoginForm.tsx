import { useState } from 'react';
import { Eye, EyeOff, User, Mail } from 'lucide-react';
import { FuturisticButton } from '@/components/ui/futuristic-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginType } from '@/types';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/logo';

interface LoginFormProps {
  loginType: LoginType;
  onLogin: (credentials: { email?: string; fullName?: string; childNumber?: string; password: string }) => void;
  error?: string;
  isLoading?: boolean;
}

export function LoginForm({ loginType, onLogin, error, isLoading }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    childNumber: '',
    password: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="card-futuristic w-full max-w-md mx-auto animate-scale-in">
      <CardHeader className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg">
              {loginType === 'admin' ? (
                <Logo imgClassName="w-8 h-8 text-primary-foreground" />
              ) : (
                <User className="w-8 h-8 text-primary-foreground" />
              )}
            </div>
            <div className="absolute -inset-1 bg-gradient-to-br from-primary/30 to-accent/30 rounded-2xl blur animate-pulse-glow -z-10" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-gradient">
          {loginType === 'admin' ? 'Admin Access' : 'User Portal'}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          {loginType === 'admin' 
            ? 'Secure administrator login to manage system'
            : 'Enter your credentials to view your information'
          }
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {loginType === 'user' ? (
            <>
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="pl-10 bg-input/50 border-border/50 focus:border-primary transition-all duration-300 focus:shadow-lg focus:shadow-primary/20"
                    required
                  />
                </div>
              </div>

              {/* Child Number Field */}
              <div className="space-y-2">
                <Label htmlFor="childNumber" className="text-sm font-medium">
                  Child Number
                </Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <User className="w-4 h-4" />
                  </div>
                  <Input
                    id="childNumber"
                    type="text"
                    placeholder="CS001"
                    value={formData.childNumber}
                    onChange={(e) => handleInputChange('childNumber', e.target.value)}
                    className="pl-10 bg-input/50 border-border/50 focus:border-primary transition-all duration-300 focus:shadow-lg focus:shadow-primary/20"
                    required
                  />
                </div>
              </div>
            </>
          ) : (
            /* Email Field for Admin */
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@compassionsafe.org"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="pl-10 bg-input/50 border-border/50 focus:border-primary transition-all duration-300 focus:shadow-lg focus:shadow-primary/20"
                  required
                />
              </div>
            </div>
          )}

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="pr-10 bg-input/50 border-border/50 focus:border-primary transition-all duration-300 focus:shadow-lg focus:shadow-primary/20"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 animate-fade-in">
              <p className="text-destructive text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <FuturisticButton
            type="submit"
            variant="futuristic"
            size="lg"
            className="w-full mt-6"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                <span>Authenticating...</span>
              </div>
            ) : (
              `Sign In ${loginType === 'admin' ? 'as Admin' : 'to Portal'}`
            )}
          </FuturisticButton>
        </form>

        {/* Help Text */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            {loginType === 'admin' 
              ? 'Password requirements: 8+ characters, 1 special char, 1 capital, 1 number'
              : 'Having trouble accessing your account? Contact your administrator.'
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
