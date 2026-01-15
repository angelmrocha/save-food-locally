import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation as useGeoLocation } from '@/contexts/LocationContext';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import {
  Heart,
  MapPin,
  Clock,
  LogOut,
  Gift,
  CheckCircle2,
  Bell,
  ArrowLeft,
  Store,
  Package,
} from 'lucide-react';

interface FoodDayProduct {
  id: string;
  name: string;
  description: string | null;
  quantity: number;
  food_type: string | null;
  pickup_time: string | null;
  merchant_id: string;
  profiles?: {
    store_name: string | null;
    address: string | null;
    whatsapp: string | null;
    latitude: number | null;
    longitude: number | null;
  };
}

interface Donation {
  id: string;
  product_id: string;
  quantity: number;
  status: string;
  donated_at: string;
  confirmed_at: string | null;
  products?: {
    name: string;
    food_type: string | null;
  };
  merchant_profile?: {
    store_name: string | null;
    address: string | null;
  };
}

export default function ONGDashboard() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { calculateDistance } = useGeoLocation();
  const [foodDayProducts, setFoodDayProducts] = useState<FoodDayProduct[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && profile?.role === 'ong') {
      fetchData();
    }
  }, [user, profile]);

  const fetchData = async () => {
    setLoading(true);

    // Fetch Food Day products
    const { data: productsData } = await supabase
      .from('products')
      .select(`
        *,
        profiles!products_merchant_id_fkey (
          store_name,
          address,
          whatsapp,
          latitude,
          longitude
        )
      `)
      .eq('status', 'food_day')
      .gt('quantity', 0)
      .order('created_at', { ascending: false });

    // Fetch donations assigned to this ONG
    const { data: donationsData } = await supabase
      .from('donations')
      .select(`
        *,
        products (name, food_type)
      `)
      .eq('ong_id', user!.id)
      .order('created_at', { ascending: false });

    setFoodDayProducts(productsData || []);
    setDonations(donationsData || []);
    setLoading(false);
  };

  const handleConfirmDonation = async (donationId: string) => {
    const { error } = await supabase
      .from('donations')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', donationId);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível confirmar a doação.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Doação confirmada!',
        description: 'O comerciante será notificado.',
      });
      fetchData();
    }
  };

  const handleViewConfirmation = (donationId: string) => {
    navigate(`/donation/${donationId}`);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner text="Carregando..." />
      </div>
    );
  }

  const pendingDonations = donations.filter((d) => d.status === 'notified');
  const confirmedDonations = donations.filter((d) => d.status === 'confirmed' || d.status === 'completed');

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Heart className="w-5 h-5 text-primary" />
            <span className="font-bold">Painel da ONG</span>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Institution Info */}
        <div className="p-4 bg-card rounded-xl border border-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
              <Heart className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-bold text-lg">
                {profile?.institution_name || profile?.name || 'Instituição'}
              </h2>
              <p className="text-sm text-muted-foreground">{profile?.address}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 bg-card rounded-xl border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="w-5 h-5 text-secondary" />
              <span className="text-xs text-muted-foreground">Pendentes</span>
            </div>
            <p className="text-2xl font-bold text-secondary">{pendingDonations.length}</p>
          </div>
          <div className="p-4 bg-card rounded-xl border border-border">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <span className="text-xs text-muted-foreground">Recebidas</span>
            </div>
            <p className="text-2xl font-bold text-primary">{confirmedDonations.length}</p>
          </div>
        </div>

        {/* Food Day Products Available */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Gift className="w-5 h-5 text-secondary" />
            <h2 className="font-bold text-lg">Alimentos Food Day</h2>
          </div>

          {foodDayProducts.length === 0 ? (
            <div className="text-center py-8 bg-card rounded-xl border border-border">
              <Package className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum alimento Food Day disponível</p>
              <p className="text-sm text-muted-foreground mt-1">
                Novos alimentos aparecerão aqui quando comerciantes ativarem o Food Day
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {foodDayProducts.map((product) => {
                const distance =
                  product.profiles?.latitude && product.profiles?.longitude
                    ? calculateDistance(product.profiles.latitude, product.profiles.longitude)
                    : null;

                return (
                  <div
                    key={product.id}
                    className="p-4 bg-gradient-to-r from-secondary/10 to-secondary/5 rounded-xl border border-secondary/30"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
                        <Gift className="w-6 h-6 text-secondary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">🎁</span>
                          <h3 className="font-semibold">{product.name}</h3>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Store className="w-4 h-4" />
                          <span>{product.profiles?.store_name || 'Comerciante'}</span>
                        </div>
                        {product.profiles?.address && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <MapPin className="w-4 h-4" />
                            <span>{product.profiles.address}</span>
                            {distance && (
                              <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                                {distance.toFixed(1)} km
                              </span>
                            )}
                          </div>
                        )}
                        {product.pickup_time && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Clock className="w-4 h-4" />
                            <span>Retirada: {product.pickup_time}</span>
                          </div>
                        )}
                        <div className="mt-2">
                          <span className="text-sm font-medium text-secondary">
                            {product.quantity} unidade(s) disponível(is)
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-center text-secondary mt-3 font-medium">
                      ONG mais próxima notificada para retirada do alimento
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Pending Donations */}
        {pendingDonations.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-secondary" />
              <h2 className="font-bold text-lg">Doações Pendentes</h2>
            </div>

            <div className="space-y-3">
              {pendingDonations.map((donation) => (
                <div
                  key={donation.id}
                  className="p-4 bg-card rounded-xl border border-secondary/50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{donation.products?.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {donation.quantity} unidade(s)
                      </p>
                    </div>
                    <Button
                      variant="gradient"
                      size="sm"
                      onClick={() => handleConfirmDonation(donation.id)}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Confirmar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Confirmed Donations */}
        {confirmedDonations.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-lg">Doações Confirmadas</h2>
            </div>

            <div className="space-y-3">
              {confirmedDonations.map((donation) => (
                <div
                  key={donation.id}
                  className="p-4 bg-card rounded-xl border border-primary/30"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{donation.products?.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Confirmado em{' '}
                        {donation.confirmed_at
                          ? new Date(donation.confirmed_at).toLocaleDateString('pt-BR')
                          : '-'}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewConfirmation(donation.id)}
                    >
                      Ver Comprovante
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* AI Description */}
        <div className="p-4 bg-muted/50 rounded-xl border border-border">
          <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
            🤖 Inteligência Artificial
          </h3>
          <p className="text-xs text-muted-foreground">
            O sistema utiliza regras heurísticas iniciais (horário, histórico e tipo de alimento)
            para ativar automaticamente o Food Day. Evolução prevista para algoritmos de IA
            preditiva para redução de excedentes e automação inteligente.
          </p>
        </div>
      </div>
    </div>
  );
}
