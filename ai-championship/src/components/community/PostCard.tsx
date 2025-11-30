'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Share2, Bookmark, Send } from 'lucide-react';

interface PostCardProps {
  post: any;
  currentUserId: string;
  onLike: (postId: string) => void;
  onSave: (postId: string) => void;
}

export function PostCard({ post, currentUserId, onLike, onSave }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(post.savedBy?.includes(currentUserId));

  const renderContent = (text: string) => {
    return text.split(' ').map((word, i) => 
      word.startsWith('#') ? <span key={i} className="text-blue-500">{word} </span> : word + ' '
    );
  };

  return (
    <Card className="p-6 hover:shadow-xl transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={post.authorAvatar} />
            <AvatarFallback>{post.authorName?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h4 className="font-semibold">{post.authorName}</h4>
            <p className="text-sm text-muted-foreground">@{post.authorUsername}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon"><Send className="h-4 w-4" /></Button>
      </div>
      <p className="mb-4">{renderContent(post.content)}</p>
      {post.imageUrl && <img src={post.imageUrl} alt="Post" className="w-full rounded-xl mb-4" />}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex gap-4">
          <Button variant="ghost" size="sm" onClick={() => { setIsLiked(!isLiked); onLike(post.id); }}>
            <Heart className={`h-4 w-4 mr-1 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
            {post.likes}
          </Button>
          <Button variant="ghost" size="sm">
            <MessageCircle className="h-4 w-4 mr-1" />{post.comments}
          </Button>
          <Button variant="ghost" size="sm"><Share2 className="h-4 w-4" /></Button>
        </div>
        <Button variant="ghost" size="sm" onClick={() => { setIsSaved(!isSaved); onSave(post.id); }}>
          <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
        </Button>
      </div>
    </Card>
  );
}
