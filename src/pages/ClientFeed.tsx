import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation as useGeoLocation } from '@/contexts/LocationContext';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { ProductCard } from '@/components/ProductCard';
import { CategoryChip } from '@/components/CategoryChip';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';

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
  active: boolean;
  image_url: string | null;
  profiles?: {
    store_name: string | null;
    latitude: number | null;
    longitude: number | null;
  };
}

const categories = ['Bakery', 'Produce', 'Meat', 'Dairy', 'Surprise Bag', 'Other'];

export default function ClientFeed() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { profile } = useAuth();
  const { calculateDistance, location } = useGeoLocation();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
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
      .eq('status', 'available')
      .gt('quantity', 0)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  // Filter and sort products
  const filteredProducts = products
    .filter((product) => {
      const matchesSearch =
        !searchQuery ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.profiles?.store_name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        !selectedCategory || product.category === selectedCategory;

      return matchesSearch && matchesCategory;
    })
    .map((product) => {
      const distance =
        product.profiles?.latitude && product.profiles?.longitude
          ? calculateDistance(product.profiles.latitude, product.profiles.longitude)
          : null;
      return { ...product, distance };
    })
    .sort((a, b) => {
      // Sort by distance if both have location
      if (a.distance !== null && b.distance !== null) {
        return a.distance - b.distance;
      }
      if (a.distance !== null) return -1;
      if (b.distance !== null) return 1;
      return 0;
    });

  const surpriseBags = filteredProducts.filter((p) => p.is_surprise_bag);
  const regularProducts = filteredProducts.filter((p) => !p.is_surprise_bag);

  return (
    <div className="min-h-screen bg-background pb-nav">
      <Header />

      {/* Search Bar */}
      <div className="px-4 pt-4 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Buscar ofertas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 h-12 rounded-xl bg-muted/50 border-0 focus-visible:ring-primary"
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-accent">
            <SlidersHorizontal className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="px-4 py-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          <CategoryChip
            category="all"
            isActive={!selectedCategory}
            onClick={() => setSelectedCategory(null)}
          />
          {categories.map((cat) => (
            <CategoryChip
              key={cat}
              category={cat}
              isActive={selectedCategory === cat}
              onClick={() =>
                setSelectedCategory(selectedCategory === cat ? null : cat)
              }
            />
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner className="py-20" text="Carregando ofertas..." />
      ) : (
        <div className="px-4 space-y-6 pb-6">
          {/* Surprise Bags Section */}
          {surpriseBags.length > 0 && !selectedCategory && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <span className="text-xl">🎁</span>
                  Sacolinhas Surpresa
                </h2>
                <button className="text-sm text-primary font-medium">
                  Ver todas
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {surpriseBags.slice(0, 4).map((product) => (
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
                    isSurpriseBag={product.is_surprise_bag}
                    category={product.category}
                    imageUrl={product.image_url || undefined}
                  />
                ))}
              </div>
            </section>
          )}

          {/* All Products */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-lg">
                {selectedCategory
                  ? `${selectedCategory}`
                  : 'Perto de você'}
              </h2>
              {location && (
                <span className="text-xs text-muted-foreground">
                  📍 Ordenado por distância
                </span>
              )}
            </div>

            {regularProducts.length === 0 && surpriseBags.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Nenhuma oferta encontrada
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {(selectedCategory ? filteredProducts : regularProducts).map(
                  (product) => (
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
                      isSurpriseBag={product.is_surprise_bag}
                      category={product.category}
                      imageUrl={product.image_url || undefined}
                    />
                  )
                )}
              </div>
            )}
          </section>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
