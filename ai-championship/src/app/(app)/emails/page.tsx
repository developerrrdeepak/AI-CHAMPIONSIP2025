


'use client';

import { useState } from 'react';
import { useFirebase } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, Mail } from 'lucide-react';

export default function EmailsPage() {
  const { firestore, user } = useFirebase() as any;
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    to: '',
    subject: '',
    body: ''
  });

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user) return;

    setLoading(true);
    try {
      const organizationId = localStorage.getItem('userOrgId') || `personal-${user.uid}`;
      await addDoc(collection(firestore, `organizations/${organizationId}/emails`), {
        ...formData,
        from: user.email,
        sentBy: user.displayName || 'User',
        sentAt: new Date().toISOString(),
        status: 'sent'
      });

      toast({
        title: 'Email Sent!',
        description: `Email sent to ${formData.to}`,
      });

      setFormData({ to: '', subject: '', body: '' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send email',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Email Center"
        description="Send emails to candidates and team members"
      />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Compose Email
          </CardTitle>
          <CardDescription>
            Send professional emails directly from the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <Label>To</Label>
              <Input
                type="email"
                value={formData.to}
                onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                placeholder="candidate@example.com"
                required
              />
            </div>
            <div>
              <Label>Subject</Label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Interview Invitation"
                required
              />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                placeholder="Dear Candidate,\n\nWe are pleased to invite you..."
                rows={10}
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
    