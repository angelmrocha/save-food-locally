import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation as useGeoLocation } from '@/contexts/LocationContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Package,
  MessageCircle,
  Minus,
  Plus,
  Store,
  Calendar,
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string | null;
  original_price: number;
  promo_price: number;
  expiration_date: string | null;
  quantity: number;
  category: string;
  is_surprise_bag: boolean;
  pickup_time: string | null;
  merchant_id: string;
  image_url: string | null;
  profiles?: {
    store_name: string | null;
    whatsapp: string | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
  };
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDistance(meters: number | null | undefined): string {
  if (!meters) return '';
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { calculateDistance } = useGeoLocation();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [reserving, setReserving] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProduct(id);
    }
  }, [id]);

  const fetchProduct = async (productId: string) => {
    setLoading(true);

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        profiles!products_merchant_id_fkey (
          store_name,
          whatsapp,
          address,
          latitude,
          longitude
        )
      `)
      .eq('id', productId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching product:', error);
    } else {
      setProduct(data);
    }
    setLoading(false);
  };

  const handleReserve = async () => {
    if (!product || !user || !profile) {
      toast({
        title: 'Faça login',
        description: 'Você precisa estar logado para reservar.',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    if (!product.profiles?.whatsapp) {
      toast({
        title: 'WhatsApp indisponível',
        description: 'O comerciante não configurou o WhatsApp.',
        variant: 'destructive',
      });
      return;
    }

    setReserving(true);

    const totalAmount = product.promo_price * quantity;
    const platformFee = totalAmount * 0.1; // 10% fee

    // Create order in database
    const { error } = await supabase.from('orders').insert({
      product_id: product.id,
      merchant_id: product.merchant_id,
      client_id: user.id,
      quantity,
      total_amount: totalAmount,
      platform_fee: platformFee,
      status: 'reserved',
    });

    if (error) {
      console.error('Error creating order:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a reserva.',
        variant: 'destructive',
      });
      setReserving(false);
      return;
    }

    // Open WhatsApp with message
    const productName = product.is_surprise_bag ? 'Sacola Surpresa' : product.name;
    const message = encodeURIComponent(
      `Olá! Quero reservar pelo Save Food:\n\n` +
      `📦 ${quantity}x ${productName}\n` +
      `💰 Total: ${formatCurrency(totalAmount)}\n\n` +
      `Aguardo confirmação! 🌿`
    );

    const whatsappNumber = product.profiles.whatsapp.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/55${whatsappNumber}?text=${message}`;

    window.open(whatsappUrl, '_blank');

    toast({
      title: 'Reserva criada!',
      description: 'Complete a reserva no WhatsApp.',
    });

    setReserving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner text="Carregando..." />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </Button>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Produto não encontrado</p>
        </div>
      </div>
    );
  }

  const discount = Math.round(
    ((product.original_price - product.promo_price) / product.original_price) * 100
  );

  const distance =
    product.profiles?.latitude && product.profiles?.longitude
      ? calculateDistance(product.profiles.latitude, product.profiles.longitude)
      : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Image Header */}
      <div
        className={`relative h-64 ${
          product.is_surprise_bag ? 'gradient-surprise' : 'bg-muted'
        }`}
      >
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-md"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {product.is_surprise_bag ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-primary-foreground">
              <Package className="w-24 h-24 mx-auto mb-2" />
              <span className="text-4xl">🎁</span>
            </div>
          </div>
        ) : product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Package className="w-20 h-20 text-muted-foreground/50" />
          </div>
        )}

        <Badge
          variant="secondary"
          className="absolute bottom-4 left-4 gradient-secondary text-secondary-foreground font-bold shadow-md px-3 py-1.5 text-sm"
        >
          -{discount}% OFF
        </Badge>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Store Info */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Store className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="font-semibold">
              {product.profiles?.store_name || 'Loja'}
            </p>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {distance !== null && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {formatDistance(distance)}
                </span>
              )}
              {product.profiles?.address && (
                <span className="truncate max-w-40">
                  {product.profiles.address}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Product Info */}
        <div>
          <h1 className="text-2xl font-bold mb-2">
            {product.is_surprise_bag ? '🎁 Sacola Surpresa' : product.name}
          </h1>

          {product.description && (
            <p className="text-muted-foreground">{product.description}</p>
          )}

          <div className="flex flex-wrap gap-2 mt-3">
            <Badge variant="outline">{product.category}</Badge>
            {product.quantity <= 3 && (
              <Badge variant="destructive">Últimas {product.quantity}!</Badge>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-3">
          {product.pickup_time && (
            <div className="flex items-center gap-2 p-3 bg-accent rounded-xl">
              <Clock className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Retirada</p>
                <p className="font-medium text-sm">{product.pickup_time}</p>
              </div>
            </div>
          )}
          {product.expiration_date && (
            <div className="flex items-center gap-2 p-3 bg-accent rounded-xl">
              <Calendar className="w-5 h-5 text-secondary" />
              <div>
                <p className="text-xs text-muted-foreground">Validade</p>
                <p className="font-medium text-sm">
                  {new Date(product.expiration_date).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Price */}
        <div className="p-4 bg-card rounded-xl border border-border">
          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-sm text-muted-foreground line-through">
              {formatCurrency(product.original_price)}
            </span>
            <span className="text-3xl font-bold text-primary">
              {formatCurrency(product.promo_price)}
            </span>
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">Quantidade</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center hover:bg-muted transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-bold text-lg w-8 text-center">
                {quantity}
              </span>
              <button
                onClick={() =>
                  setQuantity(Math.min(product.quantity, quantity + 1))
                }
                className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center hover:bg-muted transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between py-3 border-t border-border">
            <span className="font-medium">Total</span>
            <span className="text-2xl font-bold text-primary">
              {formatCurrency(product.promo_price * quantity)}
            </span>
          </div>
        </div>

        {/* Reserve Button */}
        <Button
          variant="whatsapp"
          size="xl"
          className="w-full"
          onClick={handleReserve}
          disabled={reserving || product.quantity === 0}
        >
          <MessageCircle className="w-6 h-6" />
          {reserving ? 'Criando reserva...' : 'Reservar via WhatsApp'}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Ao reservar, você será direcionado para o WhatsApp do comerciante
        </p>
      </div>
    </div>
  );
}
