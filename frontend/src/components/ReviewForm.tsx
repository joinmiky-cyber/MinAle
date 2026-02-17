'use client';

import { useState } from 'react';
import imageCompression from 'browser-image-compression';
import { uploadImage } from '@/lib/supabase';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { StarRating } from './StarRating';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, X, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReviewFormProps {
  placeId: number;
  onSuccess: () => void;
}

export function ReviewForm({ placeId, onSuccess }: ReviewFormProps) {
  const [ratingOverall, setRatingOverall] = useState(5);
  const [customerService, setCustomerService] = useState(true);
  const [wifiSpeed, setWifiSpeed] = useState(3);
  const [cleanliness, setCleanliness] = useState(3);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<{ file: File; preview: string; status: 'idle' | 'uploading' | 'success' }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const compressedImages = await Promise.all(
      files.map(async (file) => {
        const options = {
          maxSizeMB: 0.2, // ~200KB
          maxWidthOrHeight: 1200,
          useWebWorker: true,
        };
        try {
          const compressedFile = await imageCompression(file, options);
          return {
            file: compressedFile,
            preview: URL.createObjectURL(compressedFile),
            status: 'idle' as const,
          };
        } catch (error) {
          console.error('Compression error:', error);
          return null;
        }
      })
    );

    setImages(prev => [...prev, ...compressedImages.filter((img): img is NonNullable<typeof img> => img !== null)]);
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment) {
      toast.error('Please add a comment');
      return;
    }
    setIsSubmitting(true);

    try {
      const imageUrls: string[] = [];

      // Upload images
      const updatedImages = [...images];
      for (let i = 0; i < updatedImages.length; i++) {
        setImages(prev => prev.map((img, idx) => idx === i ? { ...img, status: 'uploading' } : img));
        const url = await uploadImage(updatedImages[i].file, 'reviews');
        imageUrls.push(url);
        setImages(prev => prev.map((img, idx) => idx === i ? { ...img, status: 'success' } : img));
      }

      await api.post('reviews/', {
        place: placeId,
        rating_overall: ratingOverall,
        customer_service: customerService,
        wifi_speed: wifiSpeed,
        cleanliness: cleanliness,
        comment,
        image_urls: imageUrls,
      });

      toast.success('Review submitted!');
      onSuccess();
    } catch (error) {
      toast.error('Failed to submit review');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-col items-center gap-2 p-4 bg-primary/5 rounded-xl">
          <Label className="text-lg font-bold">Overall Experience</Label>
          <StarRating rating={ratingOverall} onRatingChange={setRatingOverall} size={40} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <Label className="font-medium">Good Customer Service?</Label>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase">{customerService ? 'Yes' : 'No'}</span>
              <Switch checked={customerService} onCheckedChange={setCustomerService} />
            </div>
          </div>

          <div className="flex flex-col gap-2 p-3 border rounded-lg">
            <Label className="font-medium">Wi-Fi Speed</Label>
            <StarRating rating={wifiSpeed} onRatingChange={setWifiSpeed} size={18} />
          </div>

          <div className="flex flex-col gap-2 p-3 border rounded-lg">
            <Label className="font-medium">Cleanliness</Label>
            <StarRating rating={cleanliness} onRatingChange={setCleanliness} size={18} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="comment">Your Review</Label>
          <Textarea
            id="comment"
            placeholder="Share your experience..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[100px]"
          />
        </div>

        <div className="space-y-4">
          <Label>Photos (Compressed for fast upload)</Label>
          <div className="flex flex-wrap gap-3">
            {images.map((img, i) => (
              <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border">
                <img src={img.preview} alt="Upload" className={cn("object-cover w-full h-full", img.status !== 'success' && "opacity-50")} />
                {img.status === 'uploading' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="animate-spin text-white" size={16} />
                  </div>
                )}
                {img.status === 'success' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <CheckCircle2 className="text-green-500" size={20} />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-0 right-0 p-1 bg-black/50 text-white rounded-bl-lg"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            <label className="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
              <Plus className="text-gray-400" />
              <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageSelect} />
            </label>
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Posting...' : 'Post Review'}
      </Button>
    </form>
  );
}
