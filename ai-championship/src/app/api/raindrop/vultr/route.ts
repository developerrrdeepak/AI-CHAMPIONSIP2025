import { NextResponse } from 'next/server';
import { listInstances, createInstance } from '@/lib/vultr';

export async function GET() {
  try {
    const instances = await listInstances();
    return NextResponse.json(instances);
  } catch (error) {
    return new NextResponse('Error fetching Vultr instances', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { plan, region, os_id } = await request.json();
    const newInstance = await createInstance(plan, region, os_id);
    return NextResponse.json(newInstance);
  } catch (error) {
    return new NextResponse('Error creating Vultr instance', { status: 500 });
  }
}
