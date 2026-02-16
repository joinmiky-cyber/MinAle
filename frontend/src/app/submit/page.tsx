'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { uploadImage } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Category {
  id: number;
  name: string;
}

interface PaymentMethod {
  id: number;
  name: string;
}

interface GalleryImage {
  id: string;
  file: File;
  preview: string;
  label: string;
  status: 'idle' | 'uploading' | 'success' | 'error';
  url?: string;
}

const LABELS = ['Inside', 'Outside', 'Drink', 'Food', 'Menu', 'Amenities'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const TIME_SLOTS = Array.from({ length: 48 }).map((_, i) => {
  const hour = Math.floor(i / 2);
  const min = i % 2 === 0 ? '00' : '30';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return {
    value: `${hour.toString().padStart(2, '0')}:${min}`,
    label: `${displayHour}:${min} ${ampm}`
  };
});

export default function SubmitPlace() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [selectedPayments, setSelectedPayments] = useState<number[]>([]);

  const [openingHours, setOpeningHours] = useState<Record<string, { open: string, close: string, closed: boolean }>>(
    DAYS.reduce((acc, day) => ({ ...acc, [day]: { open: '09:00', close: '18:00', closed: false } }), {})
  );

  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [cats, pays] = await Promise.all([
        api.get('categories/'),
        api.get('payment-methods/')
      ]);
      setCategories(cats.data);
      setPaymentMethods(pays.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePaymentToggle = (id: number) => {
    setSelectedPayments(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (gallery.length + files.length > 10) {
      toast.error('Maximum 10 images allowed in gallery');
      return;
    }

    const newImages: GalleryImage[] = files.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      preview: URL.createObjectURL(file),
      label: 'Inside',
      status: 'idle'
    }));

    setGallery(prev => [...prev, ...newImages]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (id: string) => {
    setGallery(prev => {
      const filtered = prev.filter(img => img.id !== id);
      const removed = prev.find(img => img.id === id);
      if (removed) URL.revokeObjectURL(removed.preview);
      return filtered;
    });
  };

  const updateImageLabel = (id: string, label: string) => {
    setGallery(prev => prev.map(img => img.id === id ? { ...img, label } : img));
  };

  const validateHours = () => {
    for (const day of DAYS) {
      const { open, close, closed } = openingHours[day];
      if (!closed && open >= close) {
        toast.error(`Closing time must be after opening time on ${day}`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateHours()) return;
    setSubmitting(true);

    try {
      let coverImageUrl = '';
      if (coverImage) {
        coverImageUrl = await uploadImage(coverImage);
      }

      // Upload gallery images one by one to show progress
      const finalGallery: { image_url: string, label: string }[] = [];

      const updatedGallery = [...gallery];
      for (let i = 0; i < updatedGallery.length; i++) {
        const item = updatedGallery[i];
        setGallery(prev => prev.map(img => img.id === item.id ? { ...img, status: 'uploading' } : img));

        try {
          const url = await uploadImage(item.file);
          setGallery(prev => prev.map(img => img.id === item.id ? { ...img, status: 'success', url } : img));
          finalGallery.push({ image_url: url, label: item.label });
        } catch (err) {
          setGallery(prev => prev.map(img => img.id === item.id ? { ...img, status: 'error' } : img));
          throw err;
        }
      }

      await api.post('places/', {
        name,
        description,
        address,
        category: parseInt(categoryId),
        payment_methods: selectedPayments,
        opening_hours: openingHours,
        cover_image: coverImageUrl,
        gallery: finalGallery
      });

      toast.success('Place submitted successfully! Pending review.');
      router.push('/dashboard');
    } catch (err) {
      toast.error('Failed to submit place.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) return <p>Loading...</p>;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Submit New Business</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Info */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Business Name</Label>
                <Input id="name" required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Kaldi's Coffee" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select onValueChange={setCategoryId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" required value={description} onChange={e => setDescription(e.target.value)} placeholder="Tell us more about this place..." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" required value={address} onChange={e => setAddress(e.target.value)} placeholder="e.g. Bole Atlas, Addis Ababa" />
            </div>

            {/* Operating Hours */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Operating Hours</Label>
              <div className="grid gap-3">
                {DAYS.map(day => (
                  <div key={day} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <span className="w-24 font-medium">{day}</span>
                    <div className="flex items-center gap-2 flex-1">
                      {openingHours[day].closed ? (
                        <span className="text-muted-foreground italic">Closed</span>
                      ) : (
                        <>
                          <Select
                            value={openingHours[day].open}
                            onValueChange={v => setOpeningHours(prev => ({ ...prev, [day]: { ...prev[day], open: v } }))}
                          >
                            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {TIME_SLOTS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <span>to</span>
                          <Select
                            value={openingHours[day].close}
                            onValueChange={v => setOpeningHours(prev => ({ ...prev, [day]: { ...prev[day], close: v } }))}
                          >
                            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {TIME_SLOTS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setOpeningHours(prev => ({ ...prev, [day]: { ...prev[day], closed: !prev[day].closed } }))}
                    >
                      {openingHours[day].closed ? "Open" : "Close"}
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Payments */}
            <div className="space-y-2">
              <Label className="text-lg font-semibold">Accepted Payment Methods</Label>
              <div className="flex flex-wrap gap-2">
                {paymentMethods.map(pm => (
                  <Button
                    key={pm.id}
                    type="button"
                    variant={selectedPayments.includes(pm.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePaymentToggle(pm.id)}
                    className="rounded-full"
                  >
                    {pm.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Cover Image */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Cover Image</Label>
              <div className="flex items-center gap-4">
                {coverImage ? (
                  <div className="relative w-40 aspect-video rounded-lg overflow-hidden border">
                    <img src={URL.createObjectURL(coverImage)} className="object-cover w-full h-full" alt="Cover" />
                    <button
                      onClick={() => setCoverImage(null)}
                      className="absolute top-1 right-1 bg-black/50 p-1 rounded-full text-white hover:bg-black"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <Label htmlFor="cover" className="flex flex-col items-center justify-center w-40 aspect-video border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <Plus size={24} className="text-gray-400" />
                    <span className="text-xs text-gray-400 mt-1">Select Cover</span>
                    <Input id="cover" type="file" className="hidden" accept="image/*" onChange={e => setCoverImage(e.target.files?.[0] || null)} />
                  </Label>
                )}
              </div>
            </div>

            {/* Gallery */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-lg font-semibold">Gallery Images ({gallery.length}/10)</Label>
                <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleFileSelect} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {gallery.map((img) => (
                  <div key={img.id} className="group relative space-y-2">
                    <div className={cn(
                      "aspect-square rounded-xl overflow-hidden border bg-gray-100 transition-all duration-500 ease-in-out",
                      img.status === 'uploading' || img.status === 'idle' ? "opacity-50 grayscale" : "opacity-100 grayscale-0"
                    )}>
                      <img src={img.preview} className="object-cover w-full h-full" alt="Preview" />

                      {/* Status Overlays */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        {img.status === 'uploading' && (
                          <div className="flex flex-col items-center gap-1">
                            <Loader2 className="animate-spin text-white drop-shadow" />
                            <span className="text-[10px] text-white font-bold drop-shadow">Syncing...</span>
                          </div>
                        )}
                        {img.status === 'success' && (
                          <div className="flex flex-col items-center gap-1">
                            <CheckCircle2 className="text-green-500 drop-shadow-md bg-white rounded-full" size={24} />
                            <span className="text-[10px] text-white font-bold drop-shadow">Verified</span>
                          </div>
                        )}
                        {img.status === 'error' && (
                          <AlertCircle className="text-red-500 drop-shadow-md" size={24} />
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeImage(img.id)}
                        className="absolute top-1 right-1 bg-black/50 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    </div>

                    <Select value={img.label} onValueChange={(v) => updateImageLabel(img.id, v)}>
                      <SelectTrigger className="h-7 text-[10px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LABELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                ))}

                {gallery.length < 10 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square flex flex-col items-center justify-center border-2 border-dashed rounded-xl hover:bg-gray-50 transition-colors text-gray-400"
                  >
                    <Plus size={32} />
                    <span className="text-xs font-medium">Add Image</span>
                  </button>
                )}
              </div>
            </div>

            <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={submitting}>
              {submitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin" />
                  Submitting Application...
                </div>
              ) : 'Submit Business for Review'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
