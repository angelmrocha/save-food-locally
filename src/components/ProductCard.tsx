import { MapPin, Clock, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface ProductCardProps {
  id: string;
  name: string;
  storeName: string;
  originalPrice: number;
  promoPrice: number;
  pickupTime?: string;
  distance?: number | null;
  quantity: number;
  isSurpriseBag?: boolean;
  category?: string;
  imageUrl?: string;
}

function formatDistance(meters: number | null | undefined): string {
  if (!meters) return '';
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function ProductCard({
  id,
  name,
  storeName,
  originalPrice,
  promoPrice,
  pickupTime,
  distance,
  quantity,
  isSurpriseBag,
  category,
  imageUrl,
}: ProductCardProps) {
  const navigate = useNavigate();
  const discount = Math.round(((originalPrice - promoPrice) / originalPrice) * 100);

  return (
    <div
      onClick={() => navigate(`/product/${id}`)}
      className={cn(
        'relative overflow-hidden rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg active:scale-[0.98]',
        isSurpriseBag
          ? 'bg-gradient-to-br from-surprise/10 to-accent border-2 border-surprise/30'
          : 'bg-card border border-border shadow-sm'
      )}
    >
      {/* Image / Surprise Bag Icon */}
      <div
        className={cn(
          'relative h-32 overflow-hidden',
          isSurpriseBag ? 'gradient-surprise' : 'bg-muted'
        )}
      >
        {isSurpriseBag ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <Package className="w-16 h-16 text-primary-foreground opacity-90" />
              <span className="absolute -top-2 -right-2 text-3xl">🎁</span>
            </div>
          </div>
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Package className="w-12 h-12 text-muted-foreground/50" />
          </div>
        )}

        {/* Discount Badge */}
        <Badge
          variant="secondary"
          className="absolute top-2 left-2 gradient-secondary text-secondary-foreground font-bold shadow-md"
        >
          -{discount}%
        </Badge>

        {/* Quantity Badge */}
        {quantity <= 3 && (
          <Badge
            variant="destructive"
            className="absolute top-2 right-2 text-xs"
          >
            Últimas {quantity}!
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Store & Distance */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-medium truncate">{storeName}</span>
          {distance !== null && distance !== undefined && (
            <span className="flex items-center gap-1 shrink-0">
              <MapPin className="w-3 h-3" />
              {formatDistance(distance)}
            </span>
          )}
        </div>

        {/* Product Name */}
        <h3
          className={cn(
            'font-semibold text-sm line-clamp-2',
            isSurpriseBag && 'text-surprise'
          )}
        >
          {isSurpriseBag ? '🎁 Sacola Surpresa' : name}
        </h3>

        {/* Category */}
        {category && !isSurpriseBag && (
          <Badge variant="outline" className="text-xs">
            {category}
          </Badge>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-xs text-muted-foreground line-through">
            {formatCurrency(originalPrice)}
          </span>
          <span
            className={cn(
              'font-bold text-lg',
              isSurpriseBag ? 'text-surprise' : 'text-primary'
            )}
          >
            {formatCurrency(promoPrice)}
          </span>
        </div>

        {/* Pickup Time */}
        {pickupTime && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>Retirar: {pickupTime}</span>
          </div>
        )}
      </div>
    </div>
  );
}
