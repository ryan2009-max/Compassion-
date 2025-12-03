import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FuturisticButton } from '@/components/ui/futuristic-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Image as ImageIcon, Trash2, Download, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface UploadedFile {
  name: string;
  path: string;
  type: string;
  size: number;
  uploadedAt: string;
}

interface FileUploadProps {
  userId: string;
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
}

export default function FileUpload({ userId, files, onFilesChange }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploading(true);

    try {
      const uploadedFiles: UploadedFile[] = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'];
        if (!validTypes.includes(file.type)) {
          toast({
            title: "Invalid file type",
            description: `${file.name} is not a valid file type. Only images (JPEG, PNG, WEBP) and PDFs are allowed.`,
            variant: "destructive",
          });
          continue;
        }

        // Validate file size (10MB)
        if (file.size > 10485760) {
          toast({
            title: "File too large",
            description: `${file.name} exceeds the 10MB size limit.`,
            variant: "destructive",
          });
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('user-files')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        uploadedFiles.push({
          name: file.name,
          path: filePath,
          type: file.type,
          size: file.size,
          uploadedAt: new Date().toISOString(),
        });
      }

      if (uploadedFiles.length > 0) {
        const updatedFiles = [...files, ...uploadedFiles];
        
        // Update profile with file metadata
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ files: updatedFiles as any })
          .eq('user_id', userId);

        if (updateError) throw updateError;

        onFilesChange(updatedFiles);

        toast({
          title: "Success",
          description: `${uploadedFiles.length} file(s) uploaded successfully`,
        });
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteFile = async (file: UploadedFile) => {
    if (!confirm(`Are you sure you want to delete ${file.name}?`)) return;

    try {
      const { error: deleteError } = await supabase.storage
        .from('user-files')
        .remove([file.path]);

      if (deleteError) throw deleteError;

      const updatedFiles = files.filter(f => f.path !== file.path);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ files: updatedFiles as any })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      onFilesChange(updatedFiles);

      toast({
        title: "Success",
        description: "File deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Delete failed",
        description: "There was an error deleting the file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePreviewFile = async (file: UploadedFile) => {
    try {
      const { data, error } = await supabase.storage
        .from('user-files')
        .createSignedUrl(file.path, 3600); // 1 hour expiry

      if (error) throw error;
      if (!data?.signedUrl) throw new Error('No signed URL returned');

      // Open PDFs in new tab, show images in dialog
      if (file.type === 'application/pdf') {
        window.open(data.signedUrl, '_blank');
      } else {
        setPreviewUrl(data.signedUrl);
        setPreviewFile(file);
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

  const handleDownloadFile = async (file: UploadedFile) => {
    try {
      const { data, error } = await supabase.storage
        .from('user-files')
        .createSignedUrl(file.path, 60);

      if (error) throw error;
      if (!data?.signedUrl) throw new Error('No signed URL returned');

      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Download failed",
        description: "Unable to download this file.",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return ImageIcon;
    if (type === 'application/pdf') return FileText;
    return FileText;
  };

  return (
    <>
      <Card className="card-futuristic">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="w-5 h-5 text-primary" />
            <span>File Uploads</span>
          </CardTitle>
          <CardDescription>
            Upload images and PDF documents (Max 10MB per file)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/jpg,image/webp,application/pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <FuturisticButton
            variant="default"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full"
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? 'Uploading...' : 'Upload Files'}
          </FuturisticButton>

          {files.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Uploaded Files</h4>
              <div className="space-y-2">
                {files.map((file, index) => {
                  const FileIcon = getFileIcon(file.type);
                  return (
                    <Card key={index} className="bg-muted/20 border-border/50">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div 
                            className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer hover:opacity-70 transition-opacity"
                            onClick={() => handlePreviewFile(file)}
                          >
                            <FileIcon className="w-5 h-5 text-primary flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">{file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 ml-2">
                            <FuturisticButton
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDownloadFile(file)}
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </FuturisticButton>
                            <FuturisticButton
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteFile(file)}
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </FuturisticButton>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {files.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Upload className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No files uploaded yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!previewFile} onOpenChange={() => { setPreviewFile(null); setPreviewUrl(null); }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewFile?.name}</DialogTitle>
          </DialogHeader>
          {previewUrl && previewFile?.type.startsWith('image/') && (
            <div className="flex items-center justify-center">
              <img src={previewUrl} alt={previewFile.name} className="max-w-full max-h-[70vh] object-contain rounded-lg" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
