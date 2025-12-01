'use client';

import { useState, useEffect } from 'react';
import { useFirebase } from '@/firebase';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, Save, FileText, User, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProfileEditPage() {
  const { user, firestore, storage } = useFirebase() as any;
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [profileScore, setProfileScore] = useState(0);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    skills: '',
    experience: '',
    currentRole: '',
    linkedIn: '',
    github: '',
    portfolio: '',
  });

  useEffect(() => {
    if (!user || !firestore) return;

    const loadProfile = async () => {
      try {
        const userRef = doc(firestore, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const data = userSnap.data();
          setFormData({
            displayName: data.displayName || user.displayName || '',
            email: data.email || user.email || '',
            phone: data.phone || '',
            location: data.location || '',
            bio: data.bio || '',
            skills: data.skills?.join(', ') || '',
            experience: data.experience || '',
            currentRole: data.currentRole || '',
            linkedIn: data.linkedIn || '',
            github: data.github || '',
            portfolio: data.portfolio || '',
          });
          setPhotoPreview(data.photoURL || user.photoURL || '');
          calculateProfileScore(data);
        } else {
          setFormData(prev => ({
            ...prev,
            displayName: user.displayName || '',
            email: user.email || '',
          }));
          setPhotoPreview(user.photoURL || '');
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, [user, firestore]);

  const calculateProfileScore = (data: any) => {
    let score = 0;
    if (data.displayName) score += 10;
    if (data.email) score += 10;
    if (data.phone) score += 10;
    if (data.location) score += 10;
    if (data.bio) score += 15;
    if (data.skills?.length > 0) score += 15;
    if (data.experience) score += 10;
    if (data.currentRole) score += 10;
    if (data.resumeURL) score += 20;
    setProfileScore(score);
  };

  useEffect(() => {
    if (photoFile) {
      const url = URL.createObjectURL(photoFile);
      setPhotoPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [photoFile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore || !storage) return;

    setLoading(true);
    try {
      let photoURL = photoPreview;
      let resumeURL = '';

      if (photoFile) {
        const photoRef = ref(storage, `profiles/${user.uid}/photo_${Date.now()}.jpg`);
        await uploadBytes(photoRef, photoFile);
        photoURL = await getDownloadURL(photoRef);
      } else if (photoPreview && !photoFile) {
        photoURL = photoPreview;
      }

      if (resumeFile) {
        const resumeRef = ref(storage, `profiles/${user.uid}/resume.pdf`);
        await uploadBytes(resumeRef, resumeFile);
        resumeURL = await getDownloadURL(resumeRef);
      }

      const userRef = doc(firestore, 'users', user.uid);
      const profileData = {
        displayName: formData.displayName,
        email: formData.email,
        phone: formData.phone,
        location: formData.location,
        bio: formData.bio,
        skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
        experience: formData.experience,
        currentRole: formData.currentRole,
        linkedIn: formData.linkedIn,
        github: formData.github,
        portfolio: formData.portfolio,
        photoURL,
        ...(resumeURL && { resumeURL }),
        updatedAt: new Date().toISOString(),
      };

      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        await updateDoc(userRef, profileData);
      } else {
        await setDoc(userRef, {
          ...profileData,
          uid: user.uid,
          createdAt: new Date().toISOString(),
        });
      }

      toast({ 
        title: 'Profile Updated!', 
        description: 'Your profile has been successfully updated.',
      });
      
      setPhotoFile(null);
      setResumeFile(null);
    } catch (error) {
      console.error('Profile update error:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to update profile. Please try again.', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6">
      {profileScore < 100 && (
        <Card className="border-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">Profile Completeness</span>
              <span className="text-primary font-bold">{profileScore}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${profileScore}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Complete your profile to increase visibility to employers
            </p>
          </CardContent>
        </Card>
      )}
      
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
              <Avatar className="h-24 w-24 border-2">
                <AvatarImage src={photoPreview} />
                <AvatarFallback className="text-2xl">{formData.displayName?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <Label htmlFor="photo" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                    <Upload className="h-4 w-4" />
                    Upload Photo
                  </div>
                  <Input 
                    id="photo" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} 
                  />
                </Label>
                <p className="text-xs text-muted-foreground mt-2">JPG, PNG (max 5MB)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Full Name *</Label>
                <Input 
                  required
                  value={formData.displayName} 
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })} 
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input 
                  required
                  type="email"
                  value={formData.email} 
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input 
                  value={formData.phone} 
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div>
                <Label>Location</Label>
                <Input 
                  value={formData.location} 
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })} 
                  placeholder="San Francisco, CA"
                />
              </div>
              <div>
                <Label>Current Role</Label>
                <Input 
                  value={formData.currentRole} 
                  onChange={(e) => setFormData({ ...formData, currentRole: e.target.value })} 
                  placeholder="Senior Software Engineer"
                />
              </div>
              <div>
                <Label>Years of Experience</Label>
                <Input 
                  value={formData.experience} 
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })} 
                  placeholder="5"
                />
              </div>
            </div>

            <div>
              <Label>Bio</Label>
              <Textarea 
                rows={4} 
                value={formData.bio} 
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })} 
                placeholder="Tell us about yourself, your experience, and what you're looking for..."
              />
            </div>

            <div>
              <Label>Skills (comma-separated)</Label>
              <Input 
                value={formData.skills} 
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })} 
                placeholder="React, TypeScript, Node.js, Python"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>LinkedIn</Label>
                <Input 
                  value={formData.linkedIn} 
                  onChange={(e) => setFormData({ ...formData, linkedIn: e.target.value })} 
                  placeholder="linkedin.com/in/johndoe"
                />
              </div>
              <div>
                <Label>GitHub</Label>
                <Input 
                  value={formData.github} 
                  onChange={(e) => setFormData({ ...formData, github: e.target.value })} 
                  placeholder="github.com/johndoe"
                />
              </div>
              <div>
                <Label>Portfolio</Label>
                <Input 
                  value={formData.portfolio} 
                  onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })} 
                  placeholder="johndoe.com"
                />
              </div>
            </div>

            <div>
              <Label>Resume (PDF, DOC, DOCX)</Label>
              <Label htmlFor="resume" className="cursor-pointer block mt-2">
                <div className="flex items-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg hover:bg-accent hover:border-primary transition-colors">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">
                    {resumeFile ? resumeFile.name : 'Click to upload resume'}
                  </span>
                </div>
                <Input 
                  id="resume" 
                  type="file" 
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
                  className="hidden" 
                  onChange={(e) => setResumeFile(e.target.files?.[0] || null)} 
                />
              </Label>
              <p className="text-xs text-muted-foreground mt-1">PDF, DOC, or DOCX format (max 10MB)</p>
            </div>

            <Button type="submit" disabled={loading} className="w-full" size="lg">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Profile
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
