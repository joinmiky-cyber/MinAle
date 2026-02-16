'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, CreditCard, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

interface Place {
  id: number;
  name: string;
  description: string;
  address: string;
  opening_hours: Record<string, DayHours>;
  cover_image: string;
  category: { name: string };
  payment_methods: { id: number, name: string }[];
  gallery: { image_url: string, label: string }[];
}

const formatTime = (timeStr: string) => {
  if (!timeStr) return '';
  const [hourStr, min] = timeStr.split(':');
  const hour = parseInt(hourStr);
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${displayHour}:${min} ${ampm}`;
};

export default function PlaceDetail() {
  const { id } = useParams();
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlace = async () => {
      try {
        const res = await api.get(`places/${id}/`);
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
    <div className="space-y-8 pb-20 max-w-6xl mx-auto px-4">
      <Link href="/">
        <Button variant="ghost" className="gap-2 mb-4">
          <ChevronLeft size={18} />
          Back to Browse
        </Button>
      </Link>

      <div className="grid lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div className="aspect-video relative rounded-2xl overflow-hidden bg-gray-100 shadow-xl border">
            {place.cover_image ? (
              <img src={place.cover_image} alt={place.name} className="object-cover w-full h-full" />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">No Cover Image</div>
            )}
          </div>

          {place.gallery.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold">Gallery</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {place.gallery.map((img, i) => (
                  <div key={i} className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 border shadow-sm">
                    <img src={img.image_url} alt={`${place.name} ${i}`} className="object-cover w-full h-full" />
                    <div className="absolute bottom-2 left-2">
                      <Badge variant="secondary" className="opacity-90">{img.label}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge className="px-3 py-1 text-sm">{place.category.name}</Badge>
            </div>
            <h1 className="text-5xl font-black tracking-tight">{place.name}</h1>
            <div className="flex items-center gap-2 text-xl text-muted-foreground">
              <MapPin size={24} className="text-primary" />
              <span>{place.address}</span>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl border shadow-sm space-y-4">
            <h2 className="text-2xl font-bold">About this place</h2>
            <p className="text-gray-600 leading-relaxed text-lg whitespace-pre-wrap">{place.description}</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border shadow-sm">
              <div className="flex items-center gap-2 font-bold text-lg mb-4">
                <Clock size={22} className="text-primary" />
                Operating Hours
              </div>
              <div className="space-y-2">
                {place.opening_hours && typeof place.opening_hours === 'object' ? (
                  Object.entries(place.opening_hours).map(([day, hours]) => (
                    <div key={day} className="flex justify-between text-sm">
                      <span className="font-medium text-gray-500">{day}</span>
                      <span className="font-bold">
                        {hours.closed ? (
                          <span className="text-red-500">Closed</span>
                        ) : (
                          `${formatTime(hours.open)} - ${formatTime(hours.close)}`
                        )}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 italic">No hours specified</p>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border shadow-sm">
              <div className="flex items-center gap-2 font-bold text-lg mb-4">
                <CreditCard size={22} className="text-primary" />
                Payment Methods
              </div>
              <div className="flex flex-wrap gap-2">
                {place.payment_methods.map(pm => (
                  <Badge key={pm.id} variant="outline" className="rounded-full px-3 py-1 border-primary/20 bg-primary/5 text-primary">
                    {pm.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
