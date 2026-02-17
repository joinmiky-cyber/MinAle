import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  size?: number;
  className?: string;
  readonly?: boolean;
}

export function StarRating({ rating, onRatingChange, size = 20, className, readonly = false }: StarRatingProps) {
  return (
    <div className={cn("flex gap-1", className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={cn(
            "transition-colors",
            !readonly && "cursor-pointer",
            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          )}
          onClick={() => !readonly && onRatingChange?.(star)}
        />
      ))}
    </div>
  );
}
