'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Image, X } from 'lucide-react';

interface CreatePostModalProps {
  open: boolean;
  onClose: () => void;
  onPost: (content: string, imageFile: File | null) => Promise<void>;
  user: any;
}

export function CreatePostModal({ open, onClose, onPost, user }: CreatePostModalProps) {
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [moderationWarning, setModerationWarning] = useState(false); // New state variable

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // New asynchronous function for content moderation
  const moderateContent = async (text: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/moderate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      return data.isFlagged;
    } catch (error) {
      console.error('Error moderating content:', error);
      // In case of an error, default to not flagged to allow posting, or handle as per policy
      return false; 
    }
  };

  const handlePost = async () => {
    if (!content.trim()) return;
    setLoading(true);
    setModerationWarning(false); // Reset warning before new moderation check

    try {
      const isContentFlagged = await moderateContent(content);

      if (isContentFlagged) {
        setModerationWarning(true);
        setLoading(false);
        return; // Prevent post creation if flagged
      }

      await onPost(content, imageFile);
      setContent('');
      setImageFile(null);
      setImagePreview(null);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Post</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-3">
            <Avatar>
              <AvatarImage src={user?.photoURL} />
              <AvatarFallback>{user?.displayName?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder="What's on your mind?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
          {moderationWarning && ( // Conditionally render moderation warning
            <p className="text-red-500 text-sm mb-4">
              Your post contains content that violates our community guidelines and cannot be published.
            </p>
          )}
          {imagePreview && (
            <div className="relative">
              <img src={imagePreview} alt="Preview" className="w-full rounded-lg" />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => { setImageFile(null); setImagePreview(null); }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div className="flex items-center justify-between">
            <label htmlFor="image-upload">
              <Button variant="outline" size="sm" asChild>
                <span><Image className="h-4 w-4 mr-2" />Add Image</span>
              </Button>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </label>
            <Button onClick={handlePost} disabled={!content.trim() || loading}>
              {loading ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}