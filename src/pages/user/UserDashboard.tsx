import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, FileText, Heart, Home, GraduationCap, Briefcase, Gift, Shield, Stethoscope, Download, Eye, Image as ImageIcon, FolderOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { FuturisticButton } from '@/components/ui/futuristic-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useOnlineStatus } from '@/hooks/use-online-status';

interface Profile {
  id: string;
  user_id: string;
  child_number: string;
  full_name: string;
  profile_picture: string | null;
  description: string | null;
  is_active: boolean;
}

interface UserCategoryData {
  id: string;
  category_name: string;
  category_data: {
    text?: string;
    files?: Array<{
      name: string;
      url: string;
      type: string;
      uploadedAt: string;
    }>;
  };
}

const categoryIcons: Record<string, any> = {
  'Background Information': Home,
  'Home Visit': Home,
  'Health Records': Stethoscope,
  'Gifts': Gift,
  'Spiritual Development': Heart,
  'Academic Records': GraduationCap,
  'Career Dream': Briefcase,
  'Commitment Forms/Maps': FileText,
};

export default function UserDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userCategories, setUserCategories] = useState<UserCategoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState<string>('');
  const navigate = useNavigate();
  const { toast } = useToast();
  const online = useOnlineStatus();

  useEffect(() => {
    if (!online) {
      setIsLoading(false);
      toast({ title: 'Offline', description: 'Connect to the internet to load data.' });
      return;
    }
    checkAuth();
  }, [navigate, online]);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login');
        return;
      }

      // Fetch profile data
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error || !profileData) {
        await supabase.auth.signOut();
        navigate('/login');
        return;
      }

      if (!profileData.is_active) {
        setProfile(profileData);
        setIsLoading(false);
        return;
      }

      setProfile(profileData);
      await loadUserCategories(profileData.id);
    } catch (error) {
      console.error('Auth check failed:', error);
      navigate('/login');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserCategories = async (profileId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_data_categories')
        .select('*')
        .eq('profile_id', profileId);

      if (error) throw error;
      // Optionally filter Health Records from non-superadmins
      let isSuperAdmin = false;
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: role } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .eq('role', 'super-admin')
          .single();
        isSuperAdmin = !!role;
      }

      const normalized = (data || []).map(d => ({
        ...d,
        category_data: (d.category_data as any) || {}
      }));

      setUserCategories(isSuperAdmin ? normalized : normalized.filter(c => c.category_name !== 'Health Records'));
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handlePreviewFile = async (fileUrl: string, fileName: string, fileType: string) => {
    try {
      // If it's a PDF, open in new tab
      if (fileType === 'application/pdf') {
        window.open(fileUrl, '_blank');
      } else {
        // For images, show in dialog
        setPreviewUrl(fileUrl);
        setPreviewFileName(fileName);
      }
    } catch (error) {
      console.error('Error previewing file:', error);
      toast({
        title: "Preview failed",
        description: "Unable to preview this file.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadFile = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return ImageIcon;
    if (type === 'application/pdf') return FileText;
    return FileText;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out successfully",
      description: "Thank you for visiting your portal.",
    });
    navigate('/login');
  };

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Handle disabled account
  if (!profile.is_active) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center p-4">
        <Card className="card-futuristic w-full max-w-md mx-auto animate-scale-in">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-destructive/20 border border-destructive/30 rounded-2xl flex items-center justify-center">
                <Shield className="w-8 h-8 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-xl font-bold text-destructive">Account Disabled</CardTitle>
            <CardDescription className="text-center">
              Your account is currently disabled. Please contact the administrator for assistance.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
              <p className="text-sm text-destructive font-medium">
                Contact Information
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Please reach out to your program coordinator or administrator for help reactivating your account.
              </p>
            </div>
            <FuturisticButton
              variant="outline"
              className="w-full"
              onClick={() => navigate('/login')}
            >
              Return to Login
            </FuturisticButton>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="w-12 h-12">
                <AvatarImage src={profile.profile_picture || undefined} alt={profile.full_name} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-semibold">
                  {profile.full_name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold text-gradient">Welcome, {profile.full_name}</h1>
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-muted-foreground">Child #{profile.child_number}</p>
                  <Badge variant="outline" className="status-active">
                    Active
                  </Badge>
                </div>
              </div>
            </div>
            
            <FuturisticButton 
              variant="outline" 
              onClick={handleLogout}
              className="flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </FuturisticButton>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* User Info Card */}
        <Card className="card-futuristic mb-8 animate-fade-in">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={profile.profile_picture || undefined} alt={profile.full_name} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-xl font-bold">
                  {profile.full_name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gradient mb-1">{profile.full_name}</h2>
                <p className="text-muted-foreground mb-2">{profile.description || 'Welcome to your portal'}</p>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span>Child Number: #{profile.child_number}</span>
                  <Badge variant="outline" className="status-active">
                    Active Account
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Categories Section */}
        {userCategories.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {userCategories.map((category) => {
              const IconComponent = categoryIcons[category.category_name] || FolderOpen;
              const files = category.category_data.files || [];
              
              return (
                <Card key={category.id} className="card-futuristic animate-slide-in-right">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-base">
                      <IconComponent className="w-5 h-5 text-primary" />
                      <span>{category.category_name}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Display Text Content */}
                    {category.category_data.text && (
                      <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
                        <p className="text-sm whitespace-pre-wrap text-foreground">
                          {category.category_data.text}
                        </p>
                      </div>
                    )}

                    {/* Display Files */}
                    {files.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-medium text-muted-foreground uppercase">Files</h4>
                        {files.map((file: any, fileIndex: number) => {
                          const FileIcon = getFileIcon(file.type);
                          return (
                            <Card key={fileIndex} className="bg-muted/20 border-border/50">
                              <CardContent className="p-2">
                                <div className="flex items-center justify-between gap-2">
                                  <div 
                                    className="flex items-center space-x-2 flex-1 min-w-0 cursor-pointer hover:opacity-70 transition-opacity"
                                    onClick={() => handlePreviewFile(file.url, file.name, file.type)}
                                  >
                                    <FileIcon className="w-4 h-4 text-primary flex-shrink-0" />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-medium truncate">{file.name}</p>
                                      <p className="text-[10px] text-muted-foreground">
                                        {file.uploadedAt ? new Date(file.uploadedAt).toLocaleDateString() : 'Unknown date'}
                                      </p>
                                    </div>
                                  </div>
                                  <FuturisticButton
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 flex-shrink-0"
                                    onClick={() => handleDownloadFile(file.url, file.name)}
                                    title="Download"
                                  >
                                    <Download className="w-3 h-3" />
                                  </FuturisticButton>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}

                    {!category.category_data.text && files.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No content added yet
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="card-futuristic animate-fade-in">
            <CardContent className="p-12 text-center">
              <FolderOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Categories Yet</h3>
              <p className="text-muted-foreground text-sm">
                Your administrator hasn't added any categories to your profile yet.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Help Section */}
        <Card className="card-futuristic mt-8 animate-fade-in">
          <CardContent className="p-6 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-accent/20 to-primary/20 rounded-2xl flex items-center justify-center mx-auto">
                <Heart className="w-8 h-8 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Need Help?</h3>
                <p className="text-muted-foreground text-sm">
                  If you have questions about your information or need assistance, please contact your program coordinator.
                </p>
              </div>
              <FuturisticButton variant="outline" className="mt-4">
                Contact Support
              </FuturisticButton>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Image Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={() => { setPreviewUrl(null); setPreviewFileName(''); }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewFileName}</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <div className="flex items-center justify-center">
              <img src={previewUrl} alt={previewFileName} className="max-w-full max-h-[70vh] object-contain rounded-lg" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
