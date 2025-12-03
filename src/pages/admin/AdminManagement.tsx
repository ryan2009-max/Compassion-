import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { FuturisticButton } from "@/components/ui/futuristic-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, UserPlus, Trash2, Edit } from "lucide-react";

interface Admin {
  id: string;
  user_id: string;
  full_name: string;
  role: 'admin' | 'super-admin';
  created_at: string;
}

const AdminManagement = () => {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminRole, setNewAdminRole] = useState<'admin' | 'super-admin'>('admin');

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const adminData = (data || []).filter(admin => 
        admin.role === 'admin' || admin.role === 'super-admin'
      ) as Admin[];
      setAdmins(adminData);
    } catch (error) {
      console.error('Error loading admins:', error);
      toast({
        title: "Error",
        description: "Failed to load administrators",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail || !newAdminName || !newAdminPassword) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    // Validate email format and reject invalid TLDs
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidTLDs = ['.internal', '.local', '.test', '.invalid'];
    const emailLower = newAdminEmail.toLowerCase();
    
    if (!emailRegex.test(newAdminEmail)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }
    
    if (invalidTLDs.some(tld => emailLower.endsWith(tld))) {
      toast({
        title: "Invalid Email Domain",
        description: "Please use a real email domain like @gmail.com, @compassionsafe.com, etc. Domains like .internal are not supported by Supabase.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newAdminEmail,
        password: newAdminPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: newAdminName,
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("User creation failed");

      // Insert into admins table
      const { error: adminError } = await supabase
        .from('admins')
        .insert({
          user_id: authData.user.id,
          full_name: newAdminName,
          role: newAdminRole,
        });

      if (adminError) throw adminError;

      // Insert into user_roles table
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: newAdminRole,
        });

      if (roleError) throw roleError;

      toast({
        title: "Success",
        description: `Administrator ${newAdminName} has been created successfully`,
      });
      
      setShowAddDialog(false);
      setNewAdminEmail("");
      setNewAdminName("");
      setNewAdminPassword("");
      setNewAdminRole('admin');
      loadAdmins();
    } catch (error: any) {
      console.error('Error adding admin:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add administrator",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAdmin = async (adminId: string, adminName: string) => {
    if (!confirm(`Are you sure you want to remove admin access for ${adminName}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('admins')
        .delete()
        .eq('id', adminId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Removed admin access for ${adminName}`,
      });
      loadAdmins();
    } catch (error) {
      console.error('Error deleting admin:', error);
      toast({
        title: "Error",
        description: "Failed to remove administrator",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading administrators...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/admin/dashboard')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Admin Management
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage administrator accounts and permissions
              </p>
            </div>
          </div>
          <FuturisticButton
            onClick={() => setShowAddDialog(true)}
            variant="default"
            className="gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Add Administrator
          </FuturisticButton>
        </div>

        <div className="grid gap-4">
          {admins.map((admin) => (
            <Card key={admin.id} className="card-futuristic">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{admin.full_name}</CardTitle>
                    <CardDescription className="mt-1">
                      Role: <span className="text-primary font-semibold capitalize">{admin.role}</span>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDeleteAdmin(admin.id, admin.full_name)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        {admins.length === 0 && (
          <Card className="card-futuristic">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No administrators found</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Administrator</DialogTitle>
            <DialogDescription>
              Create a new administrator account with specific permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                placeholder="admin@compassionsafe.com"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use a valid email domain (e.g., @compassionsafe.com, @gmail.com)
              </p>
            </div>
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={newAdminName}
                onChange={(e) => setNewAdminName(e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={newAdminPassword}
                onChange={(e) => setNewAdminPassword(e.target.value)}
                placeholder="Enter secure password"
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={newAdminRole} onValueChange={(value: 'admin' | 'super-admin') => setNewAdminRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super-admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <FuturisticButton className="flex-1" onClick={handleAddAdmin}>
                Add Administrator
              </FuturisticButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminManagement;
