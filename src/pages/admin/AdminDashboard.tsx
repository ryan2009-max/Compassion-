import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Settings, Shield, LogOut, Plus, Search, Edit, FolderOpen, Upload, FileText, Image as ImageIcon, Download } from 'lucide-react';
import SystemSettings from './SystemSettings';
import { FuturisticButton } from '@/components/ui/futuristic-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOnlineStatus } from '@/hooks/use-online-status';

interface Admin {
  id: string;
  user_id: string;
  full_name: string;
  role: 'admin' | 'super-admin' | 'user';
}

interface Profile {
  id: string;
  user_id: string;
  child_number: string;
  full_name: string;
  profile_picture: string | null;
  description: string | null;
  is_active: boolean;
}

interface SystemCategory {
  id: string;
  name: string;
}

interface UserCategoryData {
  id: string;
  category_name: string;
  category_data: Record<string, any>;
}

/**
 * Access Restriction: Uploaded Files Visibility
 *
 * Only users with the 'super-admin' role may view uploaded files
 * within the 'Health Records' category. For all other categories,
 * files remain visible to any admin-level user.
 */
export const shouldShowFilesDiv = (
  categoryName: string,
  role: 'admin' | 'super-admin' | 'user'
) => categoryName !== 'Health Records' || role === 'super-admin';

export default function AdminDashboard() {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [isUserDetailModalOpen, setIsUserDetailModalOpen] = useState(false);
  const [showSystemSettings, setShowSystemSettings] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [isEditTextModalOpen, setIsEditTextModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryText, setCategoryText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [systemCategories, setSystemCategories] = useState<SystemCategory[]>([]);
  const [userCategories, setUserCategories] = useState<UserCategoryData[]>([]);
  const [editUserData, setEditUserData] = useState({
    fullName: '',
    childNumber: '',
    description: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const profilePictureInputRef = useRef<HTMLInputElement>(null);
  const [currentCategoryId, setCurrentCategoryId] = useState<string | null>(null);
  const [replaceCategoryId, setReplaceCategoryId] = useState<string | null>(null);
  const [newUserData, setNewUserData] = useState({
    fullName: '',
    email: '',
    childNumber: '',
    description: '',
    password: ''
  });
  const navigate = useNavigate();
  const { toast } = useToast();
  const online = useOnlineStatus();

  const usersPerPage = 8;

  useEffect(() => {
    if (!online) {
      setIsLoading(false);
      toast({ title: 'Offline', description: 'Connect to the internet to load admin data.' });
      return;
    }
    checkAuth();
    loadSystemCategories();
  }, [navigate, online]);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login');
        return;
      }

      // Fetch admin data
      const { data: adminData, error } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error || !adminData) {
        await supabase.auth.signOut();
        navigate('/login');
        return;
      }

      setAdmin(adminData);
      
      // Ensure this is actually an admin
      if (adminData.role === 'user') {
        await supabase.auth.signOut();
        navigate('/login');
        return;
      }
      
      await loadProfiles();
    } catch (error) {
      console.error('Auth check failed:', error);
      navigate('/login');
    } finally {
      setIsLoading(false);
    }
  };

  const loadProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error loading profiles:', error);
      toast({
        title: "Error",
        description: "Failed to load user profiles.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out successfully",
      description: "You have been securely logged out.",
    });
    navigate('/login');
  };

  const toggleUserStatus = async (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !profile.is_active })
        .eq('id', profileId);

      if (error) throw error;

      setProfiles(prev => prev.map(p => 
        p.id === profileId ? { ...p, is_active: !p.is_active } : p
      ));

      if (selectedProfile?.id === profileId) {
        setSelectedProfile(prev => prev ? { ...prev, is_active: !prev.is_active } : null);
      }
      
      toast({
        title: "User status updated",
        description: `${profile.full_name} has been ${profile.is_active ? 'disabled' : 'activated'}.`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update user status.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) return;
    
    if (!confirm(`Are you sure you want to delete ${profile.full_name}? This action cannot be undone.`)) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profileId);

      if (error) throw error;

      setProfiles(prev => prev.filter(p => p.id !== profileId));
      
      toast({
        title: "User deleted",
        description: `${profile.full_name} has been permanently deleted.`,
        variant: "destructive",
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user.",
        variant: "destructive",
      });
    }
  };

  const handleAddUser = async () => {
    if (!newUserData.fullName || !newUserData.email || !newUserData.childNumber || !newUserData.password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Validate password strength
    if (newUserData.password.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Use edge function to create user with admin privileges
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`https://qsipvqfqbaxmrpbmlylf.supabase.co/functions/v1/create-user`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newUserData.email,
          password: newUserData.password,
          fullName: newUserData.fullName,
          childNumber: newUserData.childNumber,
          description: newUserData.description,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create user');
      }

      await loadProfiles();
      setIsAddUserModalOpen(false);
      setNewUserData({ fullName: '', email: '', childNumber: '', description: '', password: '' });

      toast({
        title: "User Added",
        description: `${newUserData.fullName} has been successfully added.`,
      });
    } catch (error: any) {
      console.error('Error adding user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add user.",
        variant: "destructive",
      });
    }
  };

  const openUserDetails = async (profile: Profile) => {
    setSelectedProfile(profile);
    setIsUserDetailModalOpen(true);
    await loadUserCategories(profile.id);
  };

  const loadSystemCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('system_categories')
        .select('id, name')
        .order('display_order');

      if (error) throw error;
      setSystemCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadUserCategories = async (profileId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_data_categories')
        .select('*')
        .eq('profile_id', profileId);

      if (error) throw error;
      setUserCategories((data || []).map(d => ({
        ...d,
        category_data: (d.category_data as Record<string, any>) || {}
      })));
    } catch (error) {
      console.error('Error loading user categories:', error);
      toast({
        title: "Error",
        description: "Failed to load user category data.",
        variant: "destructive",
      });
    }
  };

  const handleEditUser = () => {
    if (!selectedProfile) return;
    setEditUserData({
      fullName: selectedProfile.full_name,
      childNumber: selectedProfile.child_number,
      description: selectedProfile.description || ''
    });
    setIsEditUserModalOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedProfile || !editUserData.fullName || !editUserData.childNumber) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editUserData.fullName,
          child_number: editUserData.childNumber,
          description: editUserData.description
        })
        .eq('id', selectedProfile.id);

      if (error) throw error;

      await loadProfiles();
      const updatedProfile = {
        ...selectedProfile,
        full_name: editUserData.fullName,
        child_number: editUserData.childNumber,
        description: editUserData.description
      };
      setSelectedProfile(updatedProfile);
      setIsEditUserModalOpen(false);

      toast({
        title: "User Updated",
        description: `${editUserData.fullName} has been successfully updated.`,
      });
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user.",
        variant: "destructive",
      });
    }
  };

  const handleAddCategory = async (categoryName: string) => {
    if (!selectedProfile) return;

    try {
      const { error } = await supabase
        .from('user_data_categories')
        .insert({
          profile_id: selectedProfile.id,
          category_name: categoryName,
          category_data: {}
        });

      if (error) throw error;

      await loadUserCategories(selectedProfile.id);
      
      toast({
        title: "Category Added",
        description: `${categoryName} has been added to this user.`,
      });
    } catch (error: any) {
      console.error('Error adding category:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add category.",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (categoryId: string) => {
    setCurrentCategoryId(categoryId);
    fileInputRef.current?.click();
  };

const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
  if (!event.target.files || event.target.files.length === 0 || !currentCategoryId || !selectedProfile) return;

  const file = event.target.files[0];
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF or image file (JPG, PNG, WEBP).",
        variant: "destructive",
      });
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "File size must be less than 10MB.",
        variant: "destructive",
      });
      return;
    }

  try {
    const category = userCategories.find(c => c.id === currentCategoryId);
    if (!category) return;
    const isHealth = category.category_name === 'Health Records';
    if (isHealth && admin.role !== 'super-admin') {
      toast({ title: '403 Forbidden', description: 'Only superadmins can upload health files.', variant: 'destructive' });
      return;
    }

    const fileExt = file.name.split('.')?.pop();
    const prefix = isHealth ? 'health' : `${selectedProfile.id}`;
    const fileName = `${prefix}/${currentCategoryId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('user-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('user-files')
        .getPublicUrl(fileName);

    const freshCategory = userCategories.find(c => c.id === currentCategoryId);
    if (!freshCategory) return;

      const updatedFiles = [
        ...(freshCategory.category_data.files || []),
        {
          name: file.name,
          url: publicUrl,
          type: file.type,
          uploadedAt: new Date().toISOString()
        }
      ];

      const { error: updateError } = await supabase
        .from('user_data_categories')
        .update({
          category_data: {
            ...freshCategory.category_data,
            files: updatedFiles
          }
        })
        .eq('id', currentCategoryId);

      if (updateError) throw updateError;

    await loadUserCategories(selectedProfile.id);
    
    toast({
      title: "File Uploaded",
      description: `${file.name} has been uploaded successfully.`,
    });

  } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload file.",
        variant: "destructive",
      });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setCurrentCategoryId(null);
    }
};

  const handleProfilePictureUpdate = () => {
    profilePictureInputRef.current?.click();
  };

  const handleProfilePictureChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !selectedProfile) return;

    const file = event.target.files[0];
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an image file (JPG, PNG, WEBP).",
        variant: "destructive",
      });
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Profile picture must be less than 5MB.",
        variant: "destructive",
      });
      return;
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `profile-pictures/${selectedProfile.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('user-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('user-files')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_picture: publicUrl })
        .eq('id', selectedProfile.id);

      if (updateError) throw updateError;

      setSelectedProfile({ ...selectedProfile, profile_picture: publicUrl });
      await loadProfiles();
      
      toast({
        title: "Profile Picture Updated",
        description: "Profile picture has been updated successfully.",
      });
    } catch (error: any) {
      console.error('Error updating profile picture:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile picture.",
        variant: "destructive",
      });
    } finally {
      if (profilePictureInputRef.current) {
        profilePictureInputRef.current.value = '';
      }
    }
  };

  const handleReplaceFile = async (categoryId: string) => {
    const category = userCategories.find(c => c.id === categoryId);
    if (!category || !category.category_data.files || category.category_data.files.length === 0) {
      toast({
        title: "No Files",
        description: "No files to replace. Please upload a file first.",
        variant: "destructive",
      });
      return;
    }
    setReplaceCategoryId(categoryId);
    replaceFileInputRef.current?.click();
  };

const handleReplaceFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
  if (!event.target.files || event.target.files.length === 0 || !replaceCategoryId || !selectedProfile) return;

  const file = event.target.files[0];
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF or image file (JPG, PNG, WEBP).",
        variant: "destructive",
      });
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "File size must be less than 10MB.",
        variant: "destructive",
      });
      return;
    }

  try {
    const category = userCategories.find(c => c.id === replaceCategoryId);
    if (!category || !category.category_data.files || category.category_data.files.length === 0) return;
    const isHealth = category.category_name === 'Health Records';
    if (isHealth && admin.role !== 'super-admin') {
      toast({ title: '403 Forbidden', description: 'Only superadmins can replace health files.', variant: 'destructive' });
      return;
    }

      const files = category.category_data.files;
      const lastFile = files[files.length - 1];
      
      // Delete old file from storage if it exists
      if (lastFile.url) {
        const oldFilePath = lastFile.url.split('/user-files/')[1];
        if (oldFilePath) {
          await supabase.storage.from('user-files').remove([oldFilePath]);
        }
      }

      // Upload new file
      const fileExt = file.name.split('.').pop();
    const prefix = isHealth ? 'health' : `${selectedProfile.id}`;
    const fileName = `${prefix}/${replaceCategoryId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('user-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('user-files')
        .getPublicUrl(fileName);

      // Replace the last file
    const updatedFiles = [
      ...files.slice(0, -1),
      {
        name: file.name,
        url: publicUrl,
        type: file.type,
        uploadedAt: new Date().toISOString()
      }
    ];

      const { error: updateError } = await supabase
        .from('user_data_categories')
        .update({
          category_data: {
            ...category.category_data,
            files: updatedFiles
          }
        })
        .eq('id', replaceCategoryId);

      if (updateError) throw updateError;

    await loadUserCategories(selectedProfile.id);
    
    toast({
      title: "File Replaced",
      description: `${lastFile.name} has been replaced with ${file.name}.`,
    });

  } catch (error: any) {
      console.error('Error replacing file:', error);
      toast({
        title: "Replace Failed",
        description: error.message || "Failed to replace file.",
        variant: "destructive",
      });
    } finally {
      if (replaceFileInputRef.current) {
        replaceFileInputRef.current.value = '';
      }
      setReplaceCategoryId(null);
    }
};

  // Filter and paginate profiles
  const filteredProfiles = profiles.filter(profile =>
    profile.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.child_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const startIndex = (currentPage - 1) * usersPerPage;
  const paginatedProfiles = filteredProfiles.slice(startIndex, startIndex + usersPerPage);
  const totalPages = Math.ceil(filteredProfiles.length / usersPerPage);

  if (isLoading || !admin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (showSystemSettings) {
    return <SystemSettings onBack={() => setShowSystemSettings(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gradient">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">Welcome back, {admin.full_name}</p>
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

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="card-futuristic">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gradient">{profiles.length}</div>
              <p className="text-xs text-muted-foreground">
                {profiles.filter(p => p.is_active).length} active users
              </p>
            </CardContent>
          </Card>

          <Card className="card-futuristic">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Badge variant="outline" className="status-active">Active</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{profiles.filter(p => p.is_active).length}</div>
              <p className="text-xs text-muted-foreground">
                Currently accessing the system
              </p>
            </CardContent>
          </Card>

          <Card className="card-futuristic">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disabled Users</CardTitle>
              <Badge variant="outline" className="status-disabled">Disabled</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{profiles.filter(p => !p.is_active).length}</div>
              <p className="text-xs text-muted-foreground">
                Require administrator assistance
              </p>
            </CardContent>
          </Card>
        </div>

        {/* User Management Section */}
        <Card className="card-futuristic">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">User Management</CardTitle>
                <CardDescription>Manage user accounts and access permissions</CardDescription>
              </div>
              <FuturisticButton 
                variant="futuristic" 
                size="lg"
                className="gap-2"
                onClick={() => setIsAddUserModalOpen(true)}
              >
                <Plus className="w-5 h-5" />
                Add New User
              </FuturisticButton>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or child number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-input/50 border-border/50 focus:border-primary transition-all duration-300"
              />
            </div>

            {/* User Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {paginatedProfiles.map((profile) => (
                <Card key={profile.id} className="card-futuristic interactive-scale cursor-pointer group">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={profile.profile_picture || undefined} alt={profile.full_name} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-semibold">
                          {profile.full_name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <Badge 
                        variant="outline" 
                        className={profile.is_active ? 'status-active' : 'status-disabled'}
                      >
                        {profile.is_active ? 'Active' : 'Disabled'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1">
                      <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                        {profile.full_name}
                      </h3>
                      <p className="text-xs text-muted-foreground">#{profile.child_number}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {profile.description}
                      </p>
                    </div>

                    <div className="flex flex-col space-y-2">
                      <FuturisticButton
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => openUserDetails(profile)}
                      >
                        View Details
                      </FuturisticButton>
                      <div className="flex space-x-2">
                        <FuturisticButton
                          variant={profile.is_active ? "destructive" : "success"}
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() => toggleUserStatus(profile.id)}
                        >
                          {profile.is_active ? 'Disable' : 'Activate'}
                        </FuturisticButton>
                        <FuturisticButton
                          variant="destructive"
                          size="sm"
                          className="text-xs"
                          onClick={() => handleDeleteUser(profile.id)}
                        >
                          Delete
                        </FuturisticButton>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center space-x-2">
                <FuturisticButton
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                >
                  Previous
                </FuturisticButton>
                <span className="flex items-center px-4 text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <FuturisticButton
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                >
                  Next
                </FuturisticButton>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="card-futuristic interactive-scale cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-primary" />
                <span>System Settings</span>
              </CardTitle>
              <CardDescription>
                Configure categories, fields, and system preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FuturisticButton 
                variant="outline" 
                className="w-full"
                onClick={() => setShowSystemSettings(true)}
              >
                Open Settings
              </FuturisticButton>
            </CardContent>
          </Card>

          <Card className="card-futuristic interactive-scale cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-accent" />
                <span>Admin Management</span>
              </CardTitle>
              <CardDescription>
                {admin.role === 'super-admin' ? 'Manage administrator accounts and permissions' : 'View administrator information'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FuturisticButton 
                variant="outline" 
                className="w-full"
                disabled={admin.role !== 'super-admin'}
                onClick={() => {
                  if (admin.role === 'super-admin') {
                    navigate('/admin/management');
                  }
                }}
              >
                {admin.role === 'super-admin' ? 'Manage Admins' : 'View Only'}
              </FuturisticButton>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* User Details Modal */}
      <Dialog open={isUserDetailModalOpen} onOpenChange={setIsUserDetailModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={selectedProfile?.profile_picture || undefined} alt={selectedProfile?.full_name} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-semibold">
                    {selectedProfile?.full_name?.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-bold">{selectedProfile?.full_name}</h2>
                  <p className="text-sm text-muted-foreground">#{selectedProfile?.child_number}</p>
                </div>
              </div>
              <FuturisticButton
                variant="outline"
                size="sm"
                onClick={handleProfilePictureUpdate}
              >
                <Upload className="w-4 h-4 mr-2" />
                Update Picture
              </FuturisticButton>
            </DialogTitle>
          </DialogHeader>

          {selectedProfile && (
            <Tabs defaultValue="details" className="mt-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">User Details</TabsTrigger>
                <TabsTrigger value="categories">Categories</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-6">
                {/* Status and Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="mt-1">
                      <Badge 
                        variant="outline" 
                        className={selectedProfile.is_active ? 'status-active' : 'status-disabled'}
                      >
                        {selectedProfile.is_active ? 'Active' : 'Disabled'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Child Number</label>
                    <p className="mt-1 font-mono text-sm">{selectedProfile.child_number}</p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="mt-1 text-sm">{selectedProfile.description || 'No description provided'}</p>
                </div>

                {/* Actions */}
                <div className="flex space-x-3 pt-4 border-t">
                  <FuturisticButton
                    variant="outline"
                    onClick={handleEditUser}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Update User
                  </FuturisticButton>
                  <FuturisticButton
                    variant={selectedProfile.is_active ? "destructive" : "success"}
                    onClick={() => {
                      toggleUserStatus(selectedProfile.id);
                      setSelectedProfile(prev => prev ? {...prev, is_active: !prev.is_active} : null);
                    }}
                    className="flex-1"
                  >
                    {selectedProfile.is_active ? 'Disable User' : 'Activate User'}
                  </FuturisticButton>
                </div>
              </TabsContent>

              <TabsContent value="categories" className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">User Categories</h3>
                    <Badge variant="outline">{userCategories.length} categories</Badge>
                  </div>

                  {/* Add Category Section */}
                  <Card className="p-4 bg-muted/50">
                    <div className="space-y-3">
                      <Label>Add Category to User</Label>
                      <div className="flex flex-wrap gap-2">
                        {systemCategories
                          .filter(cat => !userCategories.some(uc => uc.category_name === cat.name))
                          .map(category => (
                            <FuturisticButton
                              key={category.id}
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddCategory(category.name)}
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              {category.name}
                            </FuturisticButton>
                          ))}
                      </div>
                      {systemCategories.filter(cat => !userCategories.some(uc => uc.category_name === cat.name)).length === 0 && (
                        <p className="text-sm text-muted-foreground">All categories have been added to this user.</p>
                      )}
                    </div>
                  </Card>

                  {/* User's Categories List */}
                  <div className="space-y-3">
                    {userCategories.length === 0 ? (
                      <Card className="p-8 text-center">
                        <FolderOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                        <p className="text-muted-foreground">No categories added yet</p>
                        <p className="text-sm text-muted-foreground mt-1">Add categories using the buttons above</p>
                      </Card>
                    ) : (
                      userCategories.map((category) => (
                        <Card key={category.id} className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold">{category.category_name}</h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {category.category_data.files?.length || 0} file(s) uploaded
                                </p>
                              </div>
                              <Badge variant="outline">Active</Badge>
                            </div>

                            {/* Display saved text */}
                            {category.category_data.text && (
                              <div className="space-y-2 pt-2 border-t">
                                <p className="text-xs font-medium text-muted-foreground">Saved Text:</p>
                                <div className="p-3 bg-muted/50 rounded-md">
                                  <p className="text-sm whitespace-pre-wrap">{category.category_data.text}</p>
                                </div>
                              </div>
                            )}

                            {/* Display uploaded files (restricted visibility for Health Records) */}
                             {category.category_data.files && category.category_data.files.length > 0 &&
                              shouldShowFilesDiv(category.category_name, (admin?.role ?? 'admin')) && (
                              <div className="space-y-2 pt-2 border-t">
                                <p className="text-xs font-medium text-muted-foreground">Uploaded Files:</p>
                                <div className="space-y-2">
                                  {category.category_data.files.map((file: any, index: number) => (
                                    <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                                      <a
                                        href={file.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 flex-1 min-w-0 hover:opacity-70 transition-opacity"
                                      >
                                        {file.type?.startsWith('image/') ? (
                                          <ImageIcon className="w-4 h-4 text-primary flex-shrink-0" />
                                        ) : (
                                          <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                                        )}
                                        <span className="text-xs truncate">{file.name}</span>
                                      </a>
                                      <a
                                        href={file.url}
                                        download={file.name}
                                        className="flex-shrink-0"
                                      >
                                        <FuturisticButton
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0"
                                        >
                                          <Download className="w-3 h-3" />
                                        </FuturisticButton>
                                      </a>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="flex gap-2">
                              <FuturisticButton
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => handleFileUpload(category.id)}
                                disabled={category.category_name === 'Health Records' && admin.role !== 'super-admin'}
                                aria-disabled={category.category_name === 'Health Records' && admin.role !== 'super-admin'}
                              >
                                <Upload className="w-3 h-3 mr-1" />
                                Update
                              </FuturisticButton>
                              <FuturisticButton
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => {
                                  setEditingCategoryId(category.id);
                                  setCategoryText(category.category_data.text || '');
                                  setIsEditTextModalOpen(true);
                                }}
                                disabled={category.category_name === 'Health Records' && admin.role !== 'super-admin'}
                                aria-disabled={category.category_name === 'Health Records' && admin.role !== 'super-admin'}
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Edit
                              </FuturisticButton>
                              <FuturisticButton
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => {
                                  toast({
                                    title: "Add Fields",
                                    description: "Add functionality coming soon",
                                  });
                                }}
                                disabled={category.category_name === 'Health Records' && admin.role !== 'super-admin'}
                                aria-disabled={category.category_name === 'Health Records' && admin.role !== 'super-admin'}
                              >
                                Add
                              </FuturisticButton>
                              <FuturisticButton
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  if (confirm(`Delete ${category.category_name} category?`)) {
                                    toast({
                                      title: "Category Deleted",
                                      description: `${category.category_name} has been removed`,
                                      variant: "destructive",
                                    });
                                  }
                                }}
                                disabled={category.category_name === 'Health Records' && admin.role !== 'super-admin'}
                                aria-disabled={category.category_name === 'Health Records' && admin.role !== 'super-admin'}
                              >
                                Delete
                              </FuturisticButton>
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={replaceFileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        onChange={handleReplaceFileChange}
        className="hidden"
      />

      {/* Edit User Modal */}
      <Dialog open={isEditUserModalOpen} onOpenChange={setIsEditUserModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Update User Information</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="editFullName">Full Name *</Label>
              <Input
                id="editFullName"
                value={editUserData.fullName}
                onChange={(e) => setEditUserData(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder="Enter full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editChildNumber">Child Number *</Label>
              <Input
                id="editChildNumber"
                value={editUserData.childNumber}
                onChange={(e) => setEditUserData(prev => ({ ...prev, childNumber: e.target.value }))}
                placeholder="e.g., CS004"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editDescription">Description</Label>
              <Textarea
                id="editDescription"
                value={editUserData.description}
                onChange={(e) => setEditUserData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description about the user"
                rows={3}
              />
            </div>

            <div className="flex space-x-3 pt-4 border-t">
              <FuturisticButton
                variant="default"
                onClick={handleUpdateUser}
                className="flex-1"
              >
                Update User
              </FuturisticButton>
              <FuturisticButton
                variant="outline"
                onClick={() => setIsEditUserModalOpen(false)}
                className="flex-1"
              >
                Cancel
              </FuturisticButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Category Text Modal */}
      <Dialog open={isEditTextModalOpen} onOpenChange={setIsEditTextModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Category Text</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="categoryText">Write your text</Label>
              <Textarea
                id="categoryText"
                value={categoryText}
                onChange={(e) => setCategoryText(e.target.value)}
                placeholder="Enter text here..."
                rows={10}
                className="resize-none"
              />
            </div>

            <div className="flex space-x-3 pt-4 border-t">
              <FuturisticButton
                variant="default"
                onClick={async () => {
                  if (!editingCategoryId || !selectedProfile) return;
                  
                  try {
                    const category = userCategories.find(c => c.id === editingCategoryId);
                    if (!category) return;
                    const isHealth = category.category_name === 'Health Records';
                    if (isHealth && admin.role !== 'super-admin') {
                      toast({ title: '403 Forbidden', description: 'Only superadmins can edit health text.', variant: 'destructive' });
                      return;
                    }

                    const { error } = await supabase
                      .from('user_data_categories')
                      .update({
                        category_data: {
                          ...category.category_data,
                          text: categoryText
                        }
                      })
                      .eq('id', editingCategoryId);

                    if (error) throw error;

                    await loadUserCategories(selectedProfile.id);
                    setIsEditTextModalOpen(false);
                    setCategoryText('');
                    setEditingCategoryId(null);

                    toast({
                      title: "Text Saved",
                      description: "Category text has been updated successfully.",
                    });

                  } catch (error: any) {
                    console.error('Error saving text:', error);
                    toast({
                      title: "Error",
                      description: error.message || "Failed to save text.",
                      variant: "destructive",
                    });
                  }
                }}
                className="flex-1"
              >
                Save Text
              </FuturisticButton>
              <FuturisticButton
                variant="outline"
                onClick={() => {
                  setIsEditTextModalOpen(false);
                  setCategoryText('');
                  setEditingCategoryId(null);
                }}
                className="flex-1"
              >
                Cancel
              </FuturisticButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add User Modal */}
      <Dialog open={isAddUserModalOpen} onOpenChange={setIsAddUserModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name *</label>
              <Input
                value={newUserData.fullName}
                onChange={(e) => setNewUserData(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder="Enter full name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address *</label>
              <Input
                type="email"
                value={newUserData.email}
                onChange={(e) => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="user@example.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Child Number *</label>
              <Input
                value={newUserData.childNumber}
                onChange={(e) => setNewUserData(prev => ({ ...prev, childNumber: e.target.value }))}
                placeholder="e.g., CS004"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Password *</label>
              <Input
                type="password"
                value={newUserData.password}
                onChange={(e) => setNewUserData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="At least 6 characters"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                value={newUserData.description}
                onChange={(e) => setNewUserData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description about the user"
              />
            </div>

            <div className="flex space-x-3 pt-4 border-t">
              <FuturisticButton
                variant="default"
                onClick={handleAddUser}
                className="flex-1"
              >
                Add User
              </FuturisticButton>
              <FuturisticButton
                variant="outline"
                onClick={() => {
                  setIsAddUserModalOpen(false);
                  setNewUserData({ fullName: '', email: '', childNumber: '', description: '', password: '' });
                }}
                className="flex-1"
              >
                Cancel
              </FuturisticButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden file inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="application/pdf,image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
      />
      <input
        type="file"
        ref={replaceFileInputRef}
        onChange={handleReplaceFileChange}
        accept="application/pdf,image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
      />
      <input
        type="file"
        ref={profilePictureInputRef}
        onChange={handleProfilePictureChange}
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
      />
    </div>
  );
}
