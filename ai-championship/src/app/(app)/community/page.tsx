'use client';

import { useState } from 'react';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, query, orderBy, collectionGroup } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, MessageCircle, Heart, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CommunityPage() {
  const { user, firestore } = useFirebase();
  const { toast } = useToast();
  const [postContent, setPostContent] = useState('');
  const [loading, setLoading] = useState(false);

  const postsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collectionGroup(firestore, 'posts'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: posts } = useCollection(postsQuery);

  const handlePost = async () => {
    if (!user || !firestore || !postContent.trim()) return;

    setLoading(true);
    try {
      await addDoc(collection(firestore, 'posts'), {
        content: postContent,
        authorId: user.uid,
        authorName: user.displayName,
        authorPhoto: user.photoURL,
        likes: 0,
        comments: 0,
        createdAt: new Date().toISOString(),
      });

      setPostContent('');
      toast({ title: 'Posted!', description: 'Your post has been shared with the community.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to post.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Community Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Avatar>
              <AvatarImage src={user?.photoURL || ''} />
              <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Textarea
                placeholder="Share your thoughts with the community..."
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                rows={3}
              />
              <Button onClick={handlePost} disabled={loading || !postContent.trim()}>
                <Send className="h-4 w-4 mr-2" />
                Post
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {posts?.map((post: any) => (
          <Card key={post.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <Avatar>
                  <AvatarImage src={post.authorPhoto} />
                  <AvatarFallback>{post.authorName?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold">{post.authorName}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm mb-4">{post.content}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <button className="flex items-center gap-1 hover:text-red-500">
                      <Heart className="h-4 w-4" />
                      {post.likes || 0}
                    </button>
                    <button className="flex items-center gap-1 hover:text-primary">
                      <MessageCircle className="h-4 w-4" />
                      {post.comments || 0}
                    </button>
                    <button className="flex items-center gap-1 hover:text-blue-500">
                      <Share2 className="h-4 w-4" />
                      Share
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
