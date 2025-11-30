'use client';

import { useState, useEffect } from 'react';
import { useFirebase } from '@/firebase';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { PostCard } from '@/components/community/PostCard';
import { CreatePostModal } from '@/components/community/CreatePostModal';
import { createPost, getExplorePosts, toggleLike, savePost } from '@/lib/community-helpers';
import { Skeleton } from '@/components/ui/skeleton';

export default function CommunityPage() {
  const { user, firestore, storage } = useFirebase();
  const [activeTab, setActiveTab] = useState('explore');
  const [posts, setPosts] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firestore) return;
    setLoading(true);
    const unsubscribe = getExplorePosts(firestore, (data) => { setPosts(data); setLoading(false); });
    return () => unsubscribe?.();
  }, [firestore]);

  const handleCreatePost = async (content: string, imageFile: File | null) => {
    if (!firestore || !storage || !user) return;
    await createPost(firestore, storage, user.uid, user.displayName || 'User', user.photoURL || '', content, imageFile);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Community</h1>
          <p className="text-muted-foreground">Connect with peers and share your professional journey.</p>
        </div>

        <div className="flex items-center justify-between mb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="explore">Explore</TabsTrigger>
              <TabsTrigger value="following">Following</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Post
          </Button>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          {loading ? (
            [...Array(3)].map((_, i) => <Skeleton key={i} className="h-64" />)
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={user?.uid || ''}
                onLike={(id) => toggleLike(firestore!, id)}
                onSave={(id) => savePost(firestore!, id, user?.uid || '', post.savedBy?.includes(user?.uid))}
              />
            ))
          )}
        </div>
      </div>

      <CreatePostModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPost={handleCreatePost}
        user={user}
      />
    </div>
  );
}
