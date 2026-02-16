'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

interface Place {
  id: number;
  name: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchMyPlaces();
    }
  }, [user]);

  const fetchMyPlaces = async () => {
    try {
      const res = await api.get('places/');
      setPlaces(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) return <p>Loading...</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Submissions</h1>
        <Link href="/submit">
          <Button>Submit New Place</Button>
        </Link>
      </div>

      <div className="grid gap-4">
        {places.length > 0 ? (
          places.map((place) => (
            <Card key={place.id}>
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <h3 className="text-xl font-semibold">{place.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Submitted on {new Date(place.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={
                    place.status === 'approved' ? 'default' :
                    place.status === 'pending' ? 'secondary' : 'destructive'
                  }>
                    {place.status}
                  </Badge>
                  {place.status === 'pending' && (
                    <Link href={`/submit/edit/${place.id}`}>
                      <Button variant="outline" size="sm">Edit</Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-center py-10 bg-white border rounded">You haven&apos;t submitted any places yet.</p>
        )}
      </div>
    </div>
  );
}
