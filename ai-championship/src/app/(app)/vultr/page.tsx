'use client';

import { useState, useEffect } from 'react';
import { listInstances, createInstance } from '@/lib/vultr';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function VultrPage() {
  const [instances, setInstances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState('');
  const [region, setRegion] = useState('');
  const [osId, setOsId] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const fetchInstances = async () => {
      try {
        const instanceList = await listInstances();
        setInstances(instanceList.instances);
      } catch (error) {
        toast({
          title: 'Error fetching instances',
          description: 'Could not fetch Vultr instances.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInstances();
  }, [toast]);

  const handleCreateInstance = async () => {
    try {
      await createInstance(plan, region, parseInt(osId, 10));
      toast({
        title: 'Instance created',
        description: 'The Vultr instance has been created successfully.',
      });
      // Refresh the instance list
      const instanceList = await listInstances();
      setInstances(instanceList.instances);
    } catch (error) {
      toast({
        title: 'Error creating instance',
        description: 'Could not create Vultr instance.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Vultr Instances</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {instances.map((instance) => (
          <Card key={instance.id}>
            <CardHeader>
              <CardTitle>{instance.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p><strong>ID:</strong> {instance.id}</p>
              <p><strong>Region:</strong> {instance.region}</p>
              <p><strong>Plan:</strong> {instance.plan}</p>
              <p><strong>Status:</strong> {instance.status}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Create New Instance</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="plan">Plan</Label>
            <Input id="plan" value={plan} onChange={(e) => setPlan(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="region">Region</Label>
            <Input id="region" value={region} onChange={(e) => setRegion(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="osId">OS ID</Label>
            <Input id="osId" value={osId} onChange={(e) => setOsId(e.target.value)} />
          </div>
          <Button onClick={handleCreateInstance}>Create Instance</Button>
        </div>
      </div>
    </div>
  );
}
