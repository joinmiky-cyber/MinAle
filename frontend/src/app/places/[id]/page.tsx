'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, CreditCard, ChevronLeft, Image as ImageIcon, ThumbsUp, Wifi, Sparkles, MessageSquare, User } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { StarRating } from '@/components/StarRating';
import { ReviewForm } from '@/components/ReviewForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

interface Review {
  id: number;
  user_name: string;
  rating_overall: number;
  customer_service: number;
  wifi_speed: number;
  cleanliness: number;
  comment: string;
  helpful_count: number;
  is_helpful: boolean;
  images: { image_url: string; label: string }[];
  created_at: string;
}

interface RatingStats {
  avg_overall: number;
  avg_service: number;
  avg_wifi: number;
  avg_cleanliness: number;
  total_reviews: number;
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
  reviews: Review[];
  rating_stats: RatingStats;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const LABELS = ['All', 'Inside', 'Outside', 'Drink', 'Food', 'Menu', 'Amenities', 'User Photo'];

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
  const [selectedLabel, setSelectedLabel] = useState('All');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

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

  useEffect(() => {
    if (id) {
      fetchPlace();
    }
  }, [id]);

  const handleHelpful = async (reviewId: number) => {
    try {
      await api.post(`reviews/${reviewId}/helpful/`);
      fetchPlace();
    } catch (err: any) {
      if (err.response?.status === 401) {
        toast.error('Please log in to vote');
      } else {
        toast.error('Failed to vote');
      }
    }
  };

  const combinedGallery = useMemo(() => {
    if (!place) return [];
    const scoutImages = place.gallery.map(img => ({ ...img, source: 'Official' }));
    const reviewImages = place.reviews.flatMap(r =>
      r.images.map(img => ({ ...img, source: `Review by ${r.user_name}` }))
    );
    return [...scoutImages, ...reviewImages];
  }, [place]);

  const filteredGallery = useMemo(() => {
    if (selectedLabel === 'All') return combinedGallery;
    return combinedGallery.filter(img => img.label === selectedLabel);
  }, [combinedGallery, selectedLabel]);

  if (loading) return <div className="animate-pulse h-96 bg-gray-100 rounded-lg" />;
  if (!place) return <p>Place not found.</p>;

  return (
    <div className="space-y-8 pb-20 max-w-6xl mx-auto px-4">
      <div className="flex items-center justify-between">
        <Link href="/">
          <Button variant="ghost" className="gap-2">
            <ChevronLeft size={18} />
            Back to Browse
          </Button>
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div className="aspect-video relative rounded-2xl overflow-hidden bg-gray-100 shadow-xl border">
            {place.cover_image ? (
              <img src={place.cover_image} alt={place.name} className="object-cover w-full h-full" />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">No Cover Image</div>
            )}
          </div>

          <div className="space-y-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <ImageIcon size={20} className="text-primary" />
                  Gallery
                </h3>
                <span className="text-sm text-muted-foreground">{filteredGallery.length} images</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {LABELS.map(label => {
                  const count = label === 'All'
                    ? combinedGallery.length
                    : combinedGallery.filter(img => img.label === label).length;

                  if (count === 0 && label !== 'All') return null;

                  return (
                    <Button
                      key={label}
                      variant={selectedLabel === label ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedLabel(label)}
                      className="rounded-full h-8"
                    >
                      {label} {count > 0 && <span className="ml-1 opacity-60 text-[10px]">{count}</span>}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 transition-all duration-300">
              {filteredGallery.length > 0 ? (
                filteredGallery.map((img, i) => (
                  <div key={i} className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 border shadow-sm hover:shadow-md transition-shadow">
                    <img src={img.image_url} alt={`${place.name} ${i}`} className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110" />
                    <div className="absolute bottom-2 left-2 flex flex-col gap-1 items-start">
                      <Badge variant="secondary" className="opacity-90 backdrop-blur-sm text-[10px] py-0">{img.label}</Badge>
                      <Badge variant="outline" className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 text-[8px] py-0 border-none">{img.source}</Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-12 text-center bg-gray-50 rounded-xl border border-dashed">
                  <p className="text-muted-foreground">No images found for this category.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge className="px-3 py-1 text-sm">{place.category.name}</Badge>
              {place.rating_stats.total_reviews > 0 && (
                <div className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full text-sm font-bold">
                  <StarRating rating={Math.round(place.rating_stats.avg_overall)} size={14} readonly />
                  <span>{place.rating_stats.avg_overall.toFixed(1)}</span>
                  <span className="text-xs font-normal opacity-70">({place.rating_stats.total_reviews})</span>
                </div>
              )}
            </div>
            <h1 className="text-5xl font-black tracking-tight">{place.name}</h1>
            <div className="flex items-center gap-2 text-xl text-muted-foreground">
              <MapPin size={24} className="text-primary" />
              <span>{place.address}</span>
            </div>
          </div>

          {/* Aggregated Rating Stats */}
          {place.rating_stats.total_reviews > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-primary/5 p-6 rounded-2xl border border-primary/10">
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Overall</span>
                <span className="text-lg font-black text-primary">{place.rating_stats.avg_overall.toFixed(1)}</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Service</span>
                <StarRating rating={Math.round(place.rating_stats.avg_service)} size={12} readonly />
                <span className="text-[9px] text-muted-foreground">{place.rating_stats.avg_service.toFixed(1)}</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1"><Wifi size={10} /> Wi-Fi</span>
                <StarRating rating={Math.round(place.rating_stats.avg_wifi)} size={12} readonly />
                <span className="text-[9px] text-muted-foreground">{place.rating_stats.avg_wifi.toFixed(1)}</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1"><Sparkles size={10} /> Clean</span>
                <StarRating rating={Math.round(place.rating_stats.avg_cleanliness)} size={12} readonly />
                <span className="text-[9px] text-muted-foreground">{place.rating_stats.avg_cleanliness.toFixed(1)}</span>
              </div>
            </div>
          )}

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
                {DAYS.map((day) => {
                  const hours = place.opening_hours?.[day];
                  return (
                    <div key={day} className="flex justify-between text-sm py-1 border-b border-gray-50 last:border-0">
                      <span className={cn("font-medium", hours ? "text-gray-700" : "text-gray-400")}>{day}</span>
                      <span className="font-bold">
                        {hours ? (
                          hours.closed ? (
                            <span className="text-red-500 bg-red-50 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">Closed</span>
                          ) : (
                            <span className="text-gray-900">{formatTime(hours.open)} - {formatTime(hours.close)}</span>
                          )
                        ) : (
                          <span className="text-gray-400 italic font-normal">Not set</span>
                        )}
                      </span>
                    </div>
                  );
                })}
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

      <div className="py-12 flex flex-col items-center gap-6 bg-primary/5 rounded-3xl border border-dashed border-primary/20">
        <MessageSquare size={48} className="text-primary opacity-20" />
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-black">Visited this place?</h3>
          <p className="text-muted-foreground">Share your experience with the community and help others discover great spots.</p>
        </div>

        <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="px-12 h-14 text-lg font-bold rounded-full shadow-lg hover:shadow-xl transition-all">
              Write a Review
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Share your experience at {place.name}</DialogTitle>
            </DialogHeader>
            <ReviewForm
              placeId={place.id}
              onSuccess={() => {
                setIsReviewModalOpen(false);
                fetchPlace();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Reviews Section */}
      <div className="space-y-8 pt-12">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-black">Community Reviews</h2>
          <div className="flex gap-4 items-center">
            <span className="text-sm text-muted-foreground">{place.reviews.length} reviews total</span>
          </div>
        </div>

        <div className="grid gap-6">
          {place.reviews.length > 0 ? (
            place.reviews.map((review) => (
              <div key={review.id} className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {review.user_name[0].toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold">{review.user_name}</h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <StarRating rating={review.rating_overall} size={12} readonly />
                        <span>•</span>
                        <span>{new Date(review.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant={review.is_helpful ? "default" : "outline"}
                    size="sm"
                    className="gap-2 h-8 rounded-full"
                    onClick={() => handleHelpful(review.id)}
                  >
                    <ThumbsUp size={14} />
                    Helpful {review.helpful_count > 0 && `(${review.helpful_count})`}
                  </Button>
                </div>

                {/* Sub-ratings */}
                <div className="flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-gray-50 p-2 rounded-lg">
                  <div className="flex items-center gap-1">
                    Service: <StarRating rating={review.customer_service} size={10} readonly />
                  </div>
                  <div className="flex items-center gap-1">
                    Wi-Fi: <StarRating rating={review.wifi_speed} size={10} readonly />
                  </div>
                  <div className="flex items-center gap-1">
                    Cleanliness: <StarRating rating={review.cleanliness} size={10} readonly />
                  </div>
                </div>

                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{review.comment}</p>

                {review.images.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {review.images.map((img, i) => (
                      <div key={i} className="group relative w-24 h-24 rounded-lg overflow-hidden border">
                        <img src={img.image_url} alt="Review" className="object-cover w-full h-full cursor-pointer hover:opacity-90 transition-opacity" />
                        <div className="absolute bottom-1 left-1">
                          <Badge className="text-[8px] py-0 px-1 bg-black/60 border-none">{img.label}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed">
              <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-bold text-gray-400">No reviews yet</h3>
              <p className="text-gray-400">Be the first to share your experience!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
