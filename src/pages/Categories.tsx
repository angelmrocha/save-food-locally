import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLocation as useGeoLocation } from '@/contexts/LocationContext';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { ProductCard } from '@/components/ProductCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { 
  Croissant, 
  Apple, 
  Beef, 
  Milk, 
  Gift, 
  Package,
  ChevronRight 
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  original_price: number;
  promo_price: number;
  quantity: number;
  category: string;
  is_surprise_bag: boolean;
  pickup_time: string | null;
  image_url: string | null;
  profiles?: {
    store_name: string | null;
    latitude: number | null;
    longitude: number | null;
  };
}

interface CategoryData {
  name: string;
  label: string;
  icon: React.ElementType;
  color: string;
  count: number;
}

const categoryConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  'Bakery': { label: 'Padaria', icon: Croissant, color: 'bg-amber-500' },
  'Produce': { label: 'Hortifruti', icon: Apple, color: 'bg-green-500' },
  'Meat': { label: 'Carnes', icon: Beef, color: 'bg-red-500' },
  'Dairy': { label: 'Laticínios', icon: Milk, color: 'bg-blue-500' },
  'Surprise Bag': { label: 'Surpresa', icon: Gift, color: 'bg-primary' },
  'Other': { label: 'Outros', icon: Package, color: 'bg-gray-500' },
};

export default function Categories() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
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
      .gt('quantity', 0)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  // Count products by category
  const categoryCounts: Record<string, number> = {};
  products.forEach((p) => {
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
  });

  const categoriesData: CategoryData[] = Object.entries(categoryConfig).map(
    ([name, config]) => ({
      name,
      ...config,
      count: categoryCounts[name] || 0,
    })
  );

  const filteredProducts = selectedCategory
    ? products
        .filter((p) => p.category === selectedCategory)
        .map((product) => ({
          ...product,
          distance:
            product.profiles?.latitude && product.profiles?.longitude
              ? calculateDistance(product.profiles.latitude, product.profiles.longitude)
              : null,
        }))
        .sort((a, b) => {
          if (a.distance !== null && b.distance !== null) {
            return a.distance - b.distance;
          }
          if (a.distance !== null) return -1;
          if (b.distance !== null) return 1;
          return 0;
        })
    : [];

  return (
    <div className="min-h-screen bg-background pb-nav">
      <Header title="Categorias" />

      {loading ? (
        <LoadingSpinner className="py-20" text="Carregando..." />
      ) : selectedCategory ? (
        // Show products for selected category
        <div className="px-4 py-4">
          <button
            onClick={() => setSelectedCategory(null)}
            className="flex items-center gap-2 text-sm text-primary font-medium mb-4"
          >
            ← Voltar às categorias
          </button>

          <h2 className="font-bold text-xl mb-4">
            {categoryConfig[selectedCategory]?.label || selectedCategory}
          </h2>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Nenhum produto nesta categoria
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredProducts.map((product) => (
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
          )}
        </div>
      ) : (
        // Show category list
        <div className="px-4 py-4">
          <h2 className="font-bold text-xl mb-4">Explorar por categoria</h2>

          <div className="space-y-3">
            {categoriesData.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className="w-full flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:border-primary/30 transition-all duration-200 group"
                >
                  <div
                    className={`w-12 h-12 rounded-xl ${cat.color} flex items-center justify-center`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold">{cat.label}</h3>
                    <p className="text-sm text-muted-foreground">
                      {cat.count} {cat.count === 1 ? 'oferta' : 'ofertas'}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
