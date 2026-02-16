'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, CreditCard, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

interface Place {
  id: number;
  name: string;
  description: string;
  address: string;
  opening_hours: string;
  cover_image: string;
  category: { name: string };
  payment_methods: { id: number, name: string }[];
  gallery: { image_url: string }[];
}

export default function PlaceDetail() {
  const { id } = useParams();
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlace = async () => {
      try {
        const res = await api.get(`/places/${id}/`);
        setPlace(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchPlace();
    }
  }, [id]);

  if (loading) return <div className="animate-pulse h-96 bg-gray-100 rounded-lg" />;
  if (!place) return <p>Place not found.</p>;

  return (
    <div className="space-y-8 pb-20">
      <Link href="/">
        <Button variant="ghost" className="gap-2 mb-4">
          <ChevronLeft size={18} />
          Back to Browse
        </Button>
      </Link>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="aspect-video relative rounded-xl overflow-hidden bg-gray-100 shadow-md">
            {place.cover_image ? (
              <img src={place.cover_image} alt={place.name} className="object-cover w-full h-full" />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">No Cover Image</div>
            )}
          </div>

          {place.gallery.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {place.gallery.map((img, i) => (
                <div key={i} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img src={img.image_url} alt={`${place.name} ${i}`} className="object-cover w-full h-full" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <Badge className="mb-2">{place.category.name}</Badge>
            <h1 className="text-4xl font-bold">{place.name}</h1>
            <div className="flex items-center gap-2 text-muted-foreground mt-2">
              <MapPin size={18} />
              <span>{place.address}</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border space-y-4">
            <h2 className="text-xl font-semibold">About</h2>
            <p className="text-gray-600 whitespace-pre-wrap">{place.description}</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl border">
              <div className="flex items-center gap-2 font-semibold mb-2">
                <Clock size={18} className="text-primary" />
                Opening Hours
              </div>
              <p className="text-sm text-gray-600">{place.opening_hours || 'Not specified'}</p>
            </div>

            <div className="bg-white p-4 rounded-xl border">
              <div className="flex items-center gap-2 font-semibold mb-2">
                <CreditCard size={18} className="text-primary" />
                Payment Methods
              </div>
              <div className="flex flex-wrap gap-1">
                {place.payment_methods.map(pm => (
                  <Badge key={pm.id} variant="secondary">{pm.name}</Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
