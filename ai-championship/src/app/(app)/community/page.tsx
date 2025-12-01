'use client';

import { useState, useEffect, useMemo } from 'react';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, updateDoc, doc, arrayUnion, arrayRemove, where } from 'firebase/firestore';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Heart, MessageCircle, Share2, Briefcase, Award, FileText, Lightbulb } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserContext } from '../layout';
import type { Post, PostType } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { placeholderImages } from '@/lib/placeholder-images';

export default function CommunityPage() {
  const { firestore } = useFirebase();
  const { userId, displayName, role } = useUserContext();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [postType, setPostType] = useState<PostType>('article');
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, []);

  const postsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'posts'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: allPosts, isLoading } = useCollection<Post>(postsQuery);

  const connectionsQuery = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return query(
      collection(firestore, 'connections'),
      where('status', '==', 'accepted')
    );
  }, [firestore, userId]);

  const { data: connections } = useCollection(connectionsQuery);

  const connectedUserIds = useMemo(() => {
    if (!connections || !userId) return [];
    return connections
      .filter(c => c.requesterId === userId || c.receiverId === userId)
      .map(c => c.requesterId === userId ? c.receiverId : c.requesterId);
  }, [connections, userId]);

  const filteredPosts = useMemo(() => {
    if (!allPosts) return [];
    if (activeTab === 'all') return allPosts;
    if (activeTab === 'following') return allPosts.filter(p => connectedUserIds.includes(p.authorId));
    return allPosts.filter(p => p.type === activeTab);
  }, [allPosts, activeTab, connectedUserIds]);

  const handleCreatePost = async () => {
    if (!firestore || !userId || !postTitle.trim() || !postContent.trim()) return;

    try {
      await addDoc(collection(firestore, 'posts'), {
        authorId: userId,
        authorName: displayName,
        authorRole: role,
        type: postType,
        title: postTitle,
        content: postContent,
        likes: [],
        comments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      toast({
        title: 'Post created',
        description: 'Your post has been published successfully.',
      });

      setIsModalOpen(false);
      setPostTitle('');
      setPostContent('');
      setPostType('article');
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create post.',
      });
    }
  };

  const handleLike = async (postId: string, currentLikes: string[]) => {
    if (!firestore || !userId) return;
    try {
      const isLiked = currentLikes.includes(userId);
      await updateDoc(doc(firestore, 'posts', postId), {
        likes: isLiked ? arrayRemove(userId) : arrayUnion(userId),
      });
    } catch (error) {
      console.error(error);
    }
  };

  const getPostIcon = (type: PostType) => {
    switch (type) {
      case 'achievement': return <Award className="h-4 w-4" />;
      case 'project': return <Lightbulb className="h-4 w-4" />;
      case 'job': return <Briefcase className="h-4 w-4" />;
      case 'article': return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className={`transform transition-all duration-300 ease-out ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Community Feed</h1>
        <p className="text-muted-foreground">Connect with peers and share your professional journey.</p>
      </div>

      <div className="flex items-center justify-between mb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All Posts</TabsTrigger>
            <TabsTrigger value="following">Following</TabsTrigger>
            <TabsTrigger value="achievement">Achievements</TabsTrigger>
            <TabsTrigger value="project">Projects</TabsTrigger>
            <TabsTrigger value="job">Jobs</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Post
        </Button>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {isLoading ? (
          [...Array(3)].map((_, i) => <Skeleton key={i} className="h-64" />)
        ) : (
          filteredPosts.map((post) => (
            <Card key={post.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={post.authorAvatar || placeholderImages[0].imageUrl} />
                      <AvatarFallback>{post.authorName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{post.authorName}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">{post.authorRole}</Badge>
                        <span className="text-xs text-muted-foreground">{new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="flex items-center gap-1">
                    {getPostIcon(post.type)}
                    {post.type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{post.content}</p>
                {post.imageUrl && (
                  <img src={post.imageUrl} alt="Post" className="mt-4 rounded-lg w-full" />
                )}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLike(post.id, post.likes)}
                    className={post.likes.includes(userId!) ? 'text-red-500' : ''}
                  >
                    <Heart className={`h-4 w-4 mr-1 ${post.likes.includes(userId!) ? 'fill-current' : ''}`} />
                    {post.likes.length}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    {post.comments.length}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Share2 className="h-4 w-4 mr-1" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
        {filteredPosts.length === 0 && !isLoading && (
          <p className="text-center text-muted-foreground py-12">No posts yet</p>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Post Type</label>
              <Select value={postType} onValueChange={(v) => setPostType(v as PostType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="achievement">Achievement</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                  <SelectItem value="job">Job Opening</SelectItem>
                  <SelectItem value="article">Article</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Title</label>
              <input
                type="text"
                className="w-full mt-1 px-3 py-2 border rounded-md"
                placeholder="Enter post title..."
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Content</label>
              <Textarea
                placeholder="Share your thoughts..."
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                rows={6}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreatePost} disabled={!postTitle.trim() || !postContent.trim()}>
              Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
