'use client';

import { useState, useRef } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

interface CompanyLogoUploadProps {
  organizationId: string;
  currentLogoUrl?: string;
  storage: any;
  onUploadComplete: (logoUrl: string) => void;
}

// Compress image before upload
async function compressImage(file: File, maxWidth = 400, quality = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Compression failed'));
        }, 'image/jpeg', quality);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}

export function CompanyLogoUpload({
  organizationId,
  currentLogoUrl,
  storage,
  onUploadComplete,
}: CompanyLogoUploadProps) {
  const [logoPreview, setLogoPreview] = useState(currentLogoUrl || '');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Maximum size is 5MB',
        variant: 'destructive',
      });
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setLogoPreview(previewUrl);
    setUploading(true);

    try {
      // Compress image
      const compressedBlob = await compressImage(file);
      
      // Upload to Firebase
      const logoRef = ref(storage, `organizations/${organizationId}/logo_${Date.now()}.jpg`);
      const uploadResult = await uploadBytes(logoRef, compressedBlob);
      const downloadUrl = await getDownloadURL(uploadResult.ref);

      setLogoPreview(downloadUrl);
      onUploadComplete(downloadUrl);

      toast({
        title: 'Logo uploaded!',
        description: 'Company logo updated successfully.',
      });

      URL.revokeObjectURL(previewUrl);
    } catch (error) {
      console.error('Logo upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'Please try again.',
        variant: 'destructive',
      });
      setLogoPreview(currentLogoUrl || '');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative h-24 w-24 border-2 border-border rounded-lg overflow-hidden bg-muted flex items-center justify-center">
          {logoPreview ? (
            <img src={logoPreview} alt="Company logo" className="h-full w-full object-contain" />
          ) : (
            <Building2 className="h-10 w-10 text-muted-foreground" />
          )}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            </div>
          )}
        </div>
        
        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
            disabled={uploading}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Logo
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            PNG, JPG (max 5MB)
          </p>
        </div>
      </div>
    </div>
  );
}
