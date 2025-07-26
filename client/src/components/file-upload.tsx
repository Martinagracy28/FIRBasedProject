import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, File, X, Check, AlertCircle } from "lucide-react";
import { ipfsService } from "@/lib/ipfs";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onFilesUploaded: (hashes: string[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
  title?: string;
  description?: string;
}

interface UploadedFile {
  file: File;
  hash: string | null;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

export default function FileUpload({ 
  onFilesUploaded, 
  maxFiles = 5, 
  acceptedTypes = ['image/*', 'application/pdf', '.doc', '.docx'],
  title = "Identity Documents",
  description = "Files will be stored securely on IPFS"
}: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files).slice(0, maxFiles - uploadedFiles.length);
    
    if (newFiles.length === 0) {
      toast({
        title: "Maximum files reached",
        description: `You can only upload up to ${maxFiles} files`,
        variant: "destructive",
      });
      return;
    }

    // Add files to state and start uploading
    const filesToUpload: UploadedFile[] = newFiles.map(file => ({
      file,
      hash: null,
      status: 'uploading' as const,
    }));

    setUploadedFiles(prev => [...prev, ...filesToUpload]);

    // Upload each file
    filesToUpload.forEach((uploadFile, index) => {
      uploadToIPFS(uploadFile.file, uploadedFiles.length + index);
    });
  };

  const uploadToIPFS = async (file: File, index: number) => {
    try {
      const hash = await ipfsService.uploadFile(file);
      
      setUploadedFiles(prev => {
        const updated = prev.map((item, i) => 
          i === index 
            ? { ...item, hash, status: 'success' as const }
            : item
        );
        
        // Update parent component with all successful hashes from the updated state
        setTimeout(() => {
          const hashes = updated
            .filter(file => file.status === 'success' && file.hash)
            .map(file => file.hash!);
          onFilesUploaded(hashes);
        }, 100);
        
        return updated;
      });
      
      toast({
        title: "File uploaded successfully",
        description: `${file.name} uploaded to IPFS`,
      });
    } catch (error) {
      setUploadedFiles(prev => prev.map((item, i) => 
        i === index 
          ? { 
              ...item, 
              status: 'error' as const, 
              error: error instanceof Error ? error.message : 'Upload failed'
            }
          : item
      ));

      toast({
        title: "Upload failed",
        description: `Failed to upload ${file.name}`,
        variant: "destructive",
      });
    }
  };

  const updateParentHashes = (files: UploadedFile[]) => {
    const hashes = files
      .filter(file => file.status === 'success' && file.hash)
      .map(file => file.hash!);
    onFilesUploaded(hashes);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => {
      const newFiles = prev.filter((_, i) => i !== index);
      updateParentHashes(newFiles);
      return newFiles;
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card className={`border-2 border-dashed transition-colors ${
        isDragging 
          ? 'border-purple-400 bg-purple-50' 
          : 'border-purple-200 hover:border-purple-300'
      }`}>
        <CardContent className="p-8">
          <div 
            className="text-center"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto mb-4 text-purple-400" size={48} />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
            <p className="text-gray-500 mb-4">{description}</p>
            
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              disabled={uploadedFiles.length >= maxFiles}
            >
              <Upload className="mr-2" size={16} />
              Choose Files
            </Button>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={acceptedTypes.join(',')}
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
            
            <p className="text-xs text-gray-400 mt-2">
              Drag and drop files here, or click to select
            </p>
            <p className="text-xs text-gray-400">
              Max {maxFiles} files • Supported: Images, PDF, DOC
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold text-gray-700 mb-3">Uploaded Files</h4>
            <div className="space-y-2">
              {uploadedFiles.map((uploadedFile, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                >
                  <div className="flex items-center space-x-3">
                    <File className="text-purple-600" size={20} />
                    <div>
                      <p className="font-medium text-sm text-gray-700">
                        {uploadedFile.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(uploadedFile.file.size)}
                      </p>
                      {uploadedFile.hash && (
                        <p className="text-xs text-green-600 font-mono">
                          IPFS: {uploadedFile.hash.substring(0, 16)}...
                        </p>
                      )}
                      {uploadedFile.error && (
                        <p className="text-xs text-red-600">
                          {uploadedFile.error}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {uploadedFile.status === 'uploading' && (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                    )}
                    {uploadedFile.status === 'success' && (
                      <Check className="text-green-600" size={20} />
                    )}
                    {uploadedFile.status === 'error' && (
                      <AlertCircle className="text-red-600" size={20} />
                    )}
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}