import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLocation as useGeoLocation } from '@/contexts/LocationContext';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { ProductCard } from '@/components/ProductCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Gift, Sparkles } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string | null;
  original_price: number;
  promo_price: number;
  quantity: number;
  category: string;
  is_surprise_bag: boolean;
  pickup_time: string | null;
  merchant_id: string;
  image_url: string | null;
  profiles?: {
    store_name: string | null;
    latitude: number | null;
    longitude: number | null;
  };
}

export default function SurpriseBags() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { calculateDistance, location } = useGeoLocation();

  useEffect(() => {
    fetchSurpriseBags();
  }, []);

  const fetchSurpriseBags = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        profiles!products_merchant_id_fkey (
          store_name,
          latitude,
          longitude
        )
      `)
      .eq('active', true)
      .eq('is_surprise_bag', true)
      .gt('quantity', 0)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching surprise bags:', error);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  const productsWithDistance = products
    .map((product) => {
      const distance =
        product.profiles?.latitude && product.profiles?.longitude
          ? calculateDistance(product.profiles.latitude, product.profiles.longitude)
          : null;
      return { ...product, distance };
    })
    .sort((a, b) => {
      if (a.distance !== null && b.distance !== null) {
        return a.distance - b.distance;
      }
      if (a.distance !== null) return -1;
      if (b.distance !== null) return 1;
      return 0;
    });

  return (
    <div className="min-h-screen bg-background pb-nav">
      <Header title="Sacolinhas Surpresa" />

      {/* Hero Section */}
      <div className="gradient-surprise px-4 py-8 text-center text-primary-foreground">
        <div className="relative inline-block mb-4">
          <Gift className="w-16 h-16" />
          <Sparkles className="absolute -top-2 -right-2 w-6 h-6 animate-pulse" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Sacolinhas Surpresa</h1>
        <p className="text-sm opacity-90 max-w-xs mx-auto">
          Produtos de qualidade a preços incríveis. 
          O conteúdo é surpresa, mas a economia é garantida!
        </p>
      </div>

      {loading ? (
        <LoadingSpinner className="py-20" text="Carregando sacolinhas..." />
      ) : (
        <div className="px-4 py-6">
          {productsWithDistance.length === 0 ? (
            <div className="text-center py-12">
              <Gift className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">
                Nenhuma sacolinha disponível no momento
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Volte mais tarde para novidades!
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg">
                  {productsWithDistance.length} sacolinha
                  {productsWithDistance.length !== 1 ? 's' : ''} disponíve
                  {productsWithDistance.length !== 1 ? 'is' : 'l'}
                </h2>
                {location && (
                  <span className="text-xs text-muted-foreground">
                    📍 Por distância
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {productsWithDistance.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    storeName={product.profiles?.store_name || 'Loja'}
                    originalPrice={product.original_price}
                    promoPrice={product.promo_price}
                    pickupTime={product.pickup_time || undefined}
                    distance={product.distance}
                    quantity={product.quantity}
                    isSurpriseBag={true}
                    imageUrl={product.image_url || undefined}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <BottomNav />
    </div>
  );
}
