'use client';

import { useState, useEffect } from 'react';
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

interface Category {
  id: number;
  name: string;
}

interface PaymentMethod {
  id: number;
  name: string;
}

export default function SubmitPlace() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [selectedPayments, setSelectedPayments] = useState<number[]>([]);
  const [openingHours, setOpeningHours] = useState('');
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [galleryImages, setGalleryImages] = useState<File[]>([]);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let coverImageUrl = '';
      if (coverImage) {
        coverImageUrl = await uploadImage(coverImage);
      }

      const galleryUrls = await Promise.all(
        galleryImages.map(img => uploadImage(img))
      );

      await api.post('places/', {
        name,
        description,
        address,
        category: parseInt(categoryId),
        payment_methods: selectedPayments,
        opening_hours: openingHours,
        cover_image: coverImageUrl,
        gallery_urls: galleryUrls
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
    <div className="max-w-3xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Submit New Business</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Business Name</Label>
              <Input id="name" required value={name} onChange={e => setName(e.target.value)} />
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

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" required value={description} onChange={e => setDescription(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" required value={address} onChange={e => setAddress(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hours">Opening Hours</Label>
              <Input id="hours" placeholder="e.g. Mon-Fri 9am-5pm" value={openingHours} onChange={e => setOpeningHours(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Accepted Payment Methods</Label>
              <div className="flex flex-wrap gap-2">
                {paymentMethods.map(pm => (
                  <Button
                    key={pm.id}
                    type="button"
                    variant={selectedPayments.includes(pm.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePaymentToggle(pm.id)}
                  >
                    {pm.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cover">Cover Image</Label>
              <Input id="cover" type="file" accept="image/*" onChange={e => setCoverImage(e.target.files?.[0] || null)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gallery">Gallery Images</Label>
              <Input
                id="gallery"
                type="file"
                accept="image/*"
                multiple
                onChange={e => setGalleryImages(Array.from(e.target.files || []))}
              />
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Place'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
