import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Settings, Trash2, Edit3 } from 'lucide-react';
import { FuturisticButton } from '@/components/ui/futuristic-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SystemField {
  id: string;
  name: string;
  type: 'text' | 'textarea' | 'image' | 'video' | 'audio' | 'pdf' | 'docx';
  required: boolean;
}

interface SystemCategory {
  id: string;
  name: string;
  fields: SystemField[];
}


interface SystemSettingsProps {
  onBack: () => void;
}

export default function SystemSettings({ onBack }: SystemSettingsProps) {
  const [categories, setCategories] = useState<SystemCategory[]>([]);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddFieldOpen, setIsAddFieldOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newField, setNewField] = useState<Omit<SystemField, 'id'>>({
    name: '',
    type: 'text',
    required: false
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('system_categories')
        .select('*')
        .order('display_order');

      if (categoriesError) throw categoriesError;

      const { data: fieldsData, error: fieldsError } = await supabase
        .from('system_fields')
        .select('*')
        .order('display_order');

      if (fieldsError) throw fieldsError;

      const categoriesWithFields: SystemCategory[] = (categoriesData || []).map(cat => ({
        id: cat.id,
        name: cat.name,
        fields: (fieldsData || [])
          .filter(field => field.category_id === cat.id)
          .map(field => ({
            id: field.id,
            name: field.name,
            type: field.field_type as SystemField['type'],
            required: field.is_required
          }))
      }));

      setCategories(categoriesWithFields);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast({
        title: "Error",
        description: "Failed to load system configuration.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    try {
      const { data, error } = await supabase
        .from('system_categories')
        .insert({
          name: newCategoryName,
          display_order: categories.length + 1
        })
        .select()
        .single();

      if (error) throw error;

      setNewCategoryName('');
      setIsAddCategoryOpen(false);
      
      toast({
        title: "Category Added",
        description: `${newCategoryName} has been added successfully.`,
      });

      loadCategories();
    } catch (error) {
      console.error('Error adding category:', error);
      toast({
        title: "Error",
        description: "Failed to add category.",
        variant: "destructive",
      });
    }
  };

  const addField = async () => {
    if (!newField.name.trim() || !selectedCategoryId) return;
    
    try {
      const category = categories.find(c => c.id === selectedCategoryId);
      const { data, error } = await supabase
        .from('system_fields')
        .insert({
          category_id: selectedCategoryId,
          name: newField.name,
          field_type: newField.type,
          is_required: newField.required,
          display_order: (category?.fields.length || 0) + 1
        })
        .select()
        .single();

      if (error) throw error;

      setNewField({ name: '', type: 'text', required: false });
      setIsAddFieldOpen(false);
      
      toast({
        title: "Field Added",
        description: `${newField.name} has been added successfully.`,
      });

      loadCategories();
    } catch (error) {
      console.error('Error adding field:', error);
      toast({
        title: "Error",
        description: "Failed to add field.",
        variant: "destructive",
      });
    }
  };

  const deleteCategory = async (categoryId: string) => {
    try {
      const { error } = await supabase
        .from('system_categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      toast({
        title: "Category Deleted",
        description: "Category has been removed successfully.",
        variant: "destructive",
      });

      loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: "Error",
        description: "Failed to delete category.",
        variant: "destructive",
      });
    }
  };

  const deleteField = async (categoryId: string, fieldId: string) => {
    try {
      const { error } = await supabase
        .from('system_fields')
        .delete()
        .eq('id', fieldId);

      if (error) throw error;

      toast({
        title: "Field Deleted", 
        description: "Field has been removed successfully.",
        variant: "destructive",
      });

      loadCategories();
    } catch (error) {
      console.error('Error deleting field:', error);
      toast({
        title: "Error",
        description: "Failed to delete field.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
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
              <FuturisticButton
                variant="outline"
                size="sm"
                onClick={onBack}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </FuturisticButton>
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                <Settings className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gradient">System Settings</h1>
                <p className="text-sm text-muted-foreground">Configure categories, fields, and system preferences</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="categories" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="categories">Data Categories</TabsTrigger>
            <TabsTrigger value="fields">Field Management</TabsTrigger>
            <TabsTrigger value="preferences">System Preferences</TabsTrigger>
          </TabsList>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <Card className="card-futuristic">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Data Categories</CardTitle>
                    <CardDescription>Manage user data categories and their structure</CardDescription>
                  </div>
                  <FuturisticButton
                    variant="glow"
                    onClick={() => setIsAddCategoryOpen(true)}
                    className="flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Category</span>
                  </FuturisticButton>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((category) => (
                    <Card key={category.id} className="card-futuristic">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{category.name}</h3>
                          <FuturisticButton
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteCategory(category.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </FuturisticButton>
                        </div>
                        <div className="space-y-2">
                          <Badge variant="outline" className="text-xs">
                            {category.fields.length} fields
                          </Badge>
                          <div className="text-xs text-muted-foreground space-y-1">
                            {category.fields.slice(0, 3).map((field) => (
                              <div key={field.id} className="flex items-center justify-between">
                                <span>{field.name}</span>
                                <Badge variant={field.required ? "default" : "secondary"} className="text-xs">
                                  {field.type}
                                </Badge>
                              </div>
                            ))}
                            {category.fields.length > 3 && (
                              <div className="text-muted-foreground">+{category.fields.length - 3} more</div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fields Tab */}
          <TabsContent value="fields" className="space-y-6">
            <Card className="card-futuristic">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Field Management</CardTitle>
                    <CardDescription>Add and manage fields within categories</CardDescription>
                  </div>
                  <FuturisticButton
                    variant="glow"
                    onClick={() => setIsAddFieldOpen(true)}
                    className="flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Field</span>
                  </FuturisticButton>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {categories.map((category) => (
                  <div key={category.id} className="space-y-3">
                    <h3 className="text-lg font-semibold border-b pb-2">{category.name}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {category.fields.map((field) => (
                        <Card key={field.id} className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-sm">{field.name}</span>
                                {field.required && (
                                  <Badge variant="destructive" className="text-xs">Required</Badge>
                                )}
                              </div>
                              <Badge variant="outline" className="text-xs">{field.type}</Badge>
                            </div>
                            <div className="flex space-x-1">
                              <FuturisticButton
                                variant="outline"
                                size="sm"
                                className="text-xs px-2 py-1"
                              >
                                <Edit3 className="w-3 h-3" />
                              </FuturisticButton>
                              <FuturisticButton
                                variant="destructive"
                                size="sm"
                                className="text-xs px-2 py-1"
                                onClick={() => deleteField(category.id, field.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </FuturisticButton>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <Card className="card-futuristic">
              <CardHeader>
                <CardTitle>System Preferences</CardTitle>
                <CardDescription>Configure global system settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">User Management</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Auto-activate new users</Label>
                        <Badge variant="outline">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Require profile pictures</Label>
                        <Badge variant="secondary">Disabled</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold">Data Policies</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Data retention period</Label>
                        <Badge variant="outline">7 years</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Backup frequency</Label>
                        <Badge variant="outline">Daily</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Category Modal */}
      <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="categoryName">Category Name</Label>
              <Input
                id="categoryName"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Enter category name..."
              />
            </div>
            <div className="flex space-x-3">
              <FuturisticButton
                variant="outline"
                onClick={() => setIsAddCategoryOpen(false)}
                className="flex-1"
              >
                Cancel
              </FuturisticButton>
              <FuturisticButton
                onClick={addCategory}
                className="flex-1"
              >
                Add Category
              </FuturisticButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Field Modal */}
      <Dialog open={isAddFieldOpen} onOpenChange={setIsAddFieldOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Field</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="categorySelect">Select Category</Label>
              <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a category..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="fieldName">Field Name</Label>
              <Input
                id="fieldName"
                value={newField.name}
                onChange={(e) => setNewField(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter field name..."
              />
            </div>
            <div>
              <Label htmlFor="fieldType">Field Type</Label>
              <Select 
                value={newField.type} 
                onValueChange={(value: SystemField['type']) => setNewField(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="textarea">Textarea</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="docx">Word Document</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="required"
                checked={newField.required}
                onChange={(e) => setNewField(prev => ({ ...prev, required: e.target.checked }))}
              />
              <Label htmlFor="required">Required field</Label>
            </div>
            <div className="flex space-x-3">
              <FuturisticButton
                variant="outline"
                onClick={() => setIsAddFieldOpen(false)}
                className="flex-1"
              >
                Cancel
              </FuturisticButton>
              <FuturisticButton
                onClick={addField}
                className="flex-1"
              >
                Add Field
              </FuturisticButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}