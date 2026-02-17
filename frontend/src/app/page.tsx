'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Star } from 'lucide-react';
import Link from 'next/link';

interface Category {
  id: number;
  name: string;
}

interface Place {
  id: number;
  name: string;
  address: string;
  category_name: string;
  cover_image: string;
  avg_rating: number | null;
  total_reviews: number;
}

export default function Home() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
    fetchPlaces();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('categories/');
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPlaces = async (categoryId?: number, searchTerm?: string) => {
    setLoading(true);
    try {
      let url = 'places/?status=approved';
      if (categoryId) url += `&category=${categoryId}`;
      if (searchTerm) url += `&search=${searchTerm}`;

      const res = await api.get(url);
      setPlaces(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPlaces(selectedCategory || undefined, search);
  };

  const handleCategoryClick = (id: number) => {
    const newCat = selectedCategory === id ? null : id;
    setSelectedCategory(newCat);
    fetchPlaces(newCat || undefined, search);
  };

  return (
    <div className="space-y-8">
      <section className="text-center space-y-4 max-w-2xl mx-auto">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
          Discover Local Gems in Ethiopia
        </h1>
        <p className="text-xl text-muted-foreground">
          Find the best spots for macchiato, gyms, salons, and more.
        </p>

        <form onSubmit={handleSearch} className="flex gap-2 pt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Search by name, description or address..."
              className="pl-10 h-12"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button type="submit" size="lg" className="h-12 px-8">Search</Button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Categories</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              onClick={() => handleCategoryClick(cat.id)}
              className="rounded-full"
            >
              {cat.name}
            </Button>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="aspect-video bg-gray-200" />
              <CardContent className="h-32" />
            </Card>
          ))
        ) : places.length > 0 ? (
          places.map((place) => (
            <Link href={`/places/${place.id}`} key={place.id}>
              <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
                <div className="aspect-video relative bg-gray-100">
                  {place.cover_image ? (
                    <img
                      src={place.cover_image}
                      alt={place.name}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      No Image
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded text-xs font-medium">
                    {place.category_name}
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="line-clamp-1">{place.name}</CardTitle>
                    <div className="flex items-center gap-1 shrink-0 bg-yellow-50 px-1.5 py-0.5 rounded border border-yellow-100">
                      <Star className="fill-yellow-400 text-yellow-400" size={14} />
                      <span className="text-xs font-bold text-yellow-700">
                        {place.avg_rating ? Number(place.avg_rating).toFixed(1) : "N/A"}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col justify-between">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
                    <MapPin size={14} />
                    <span className="line-clamp-1">{place.address}</span>
                  </div>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                    {place.total_reviews > 0 ? `${place.total_reviews} Reviews` : "No Reviews Yet"}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-20 bg-white rounded-lg border border-dashed">
            <p className="text-muted-foreground">No places found matching your criteria.</p>
          </div>
        )}
      </section>
    </div>
  );
}
