'use client';

import { useState } from 'react';
import { useFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, Save, FileText, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ProfileEditPage() {
  const { user, firestore, storage } = useFirebase();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
    phone: '',
    location: '',
    bio: '',
    skills: '',
    experience: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore || !storage) return;

    setLoading(true);
    try {
      let photoURL = user.photoURL;
      let resumeURL = '';

      if (photoFile) {
        const photoRef = ref(storage, `profiles/${user.uid}/photo`);
        await uploadBytes(photoRef, photoFile);
        photoURL = await getDownloadURL(photoRef);
      }

      if (resumeFile) {
        const resumeRef = ref(storage, `profiles/${user.uid}/resume`);
        await uploadBytes(resumeRef, resumeFile);
        resumeURL = await getDownloadURL(resumeRef);
      }

      const userRef = doc(firestore, 'users', user.uid);
      await updateDoc(userRef, {
        ...formData,
        photoURL,
        resumeURL,
        updatedAt: new Date().toISOString(),
      });

      toast({ title: 'Profile Updated!', description: 'Your profile has been successfully updated.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update profile.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Edit Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={photoFile ? URL.createObjectURL(photoFile) : user?.photoURL || ''} />
                <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <Label htmlFor="photo" className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
                  <Upload className="h-4 w-4" />
                  Upload Photo
                </div>
                <Input id="photo" type="file" accept="image/*" className="hidden" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
              </Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Full Name</Label>
                <Input value={formData.displayName} onChange={(e) => setFormData({ ...formData, displayName: e.target.value })} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </div>
            </div>

            <div>
              <Label>Bio</Label>
              <Textarea rows={4} value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} />
            </div>

            <div>
              <Label>Resume (PDF)</Label>
              <Label htmlFor="resume" className="cursor-pointer block mt-2">
                <div className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-accent">
                  <FileText className="h-4 w-4" />
                  {resumeFile ? resumeFile.name : 'Upload Resume'}
                </div>
                <Input id="resume" type="file" accept=".pdf" className="hidden" onChange={(e) => setResumeFile(e.target.files?.[0] || null)} />
              </Label>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
