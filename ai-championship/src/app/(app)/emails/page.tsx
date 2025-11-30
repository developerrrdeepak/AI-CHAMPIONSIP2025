
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';

export default function EmailsPage() {
  return (
    <>
      <PageHeader
        title="Email Center"
        description="Manage your email templates and campaigns."
      >
        <Button asChild>
          <Link href="/emails/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Template
          </Link>
        </Button>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Email Templates</CardTitle>
          <CardDescription>
            This section is under construction. Soon you'll be able to manage all
            your email templates from here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No templates created yet.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
    