import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import {
  ArrowLeft,
  CheckCircle2,
  Store,
  Heart,
  Calendar,
  Clock,
  Package,
  Shield,
  FileText,
} from 'lucide-react';

interface DonationDetails {
  id: string;
  quantity: number;
  donated_at: string;
  confirmed_at: string | null;
  status: string;
  legal_confirmation_text: string;
  products?: {
    name: string;
    food_type: string | null;
    description: string | null;
  };
  merchant_profile?: {
    store_name: string | null;
    name: string | null;
    address: string | null;
  };
  ong_profile?: {
    institution_name: string | null;
    name: string | null;
    address: string | null;
  };
}

export default function DonationConfirmation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [donation, setDonation] = useState<DonationDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchDonation();
    }
  }, [id]);

  const fetchDonation = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('donations')
      .select(`
        *,
        products (name, food_type, description)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching donation:', error);
    }

    // Fetch merchant and ONG profiles separately
    if (data) {
      const { data: merchantProfile } = await supabase
        .from('profiles')
        .select('store_name, name, address')
        .eq('id', data.merchant_id)
        .maybeSingle();

      const { data: ongProfile } = data.ong_id
        ? await supabase
            .from('profiles')
            .select('institution_name, name, address')
            .eq('id', data.ong_id)
            .maybeSingle()
        : { data: null };

      setDonation({
        ...data,
        merchant_profile: merchantProfile,
        ong_profile: ongProfile,
      } as DonationDetails);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner text="Carregando comprovante..." />
      </div>
    );
  }

  if (!donation) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <Package className="w-16 h-16 text-muted-foreground/50 mb-4" />
        <h1 className="text-xl font-bold mb-2">Doação não encontrada</h1>
        <p className="text-muted-foreground text-center mb-6">
          O comprovante de doação não foi encontrado.
        </p>
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
      </div>
    );
  }

  const donatedDate = new Date(donation.donated_at);
  const confirmedDate = donation.confirmed_at ? new Date(donation.confirmed_at) : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-primary text-primary-foreground">
        <div className="flex items-center gap-3 px-4 h-14">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            <span className="font-bold">Comprovante de Doação</span>
          </div>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Success Banner */}
        <div className="text-center py-6">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-primary mb-2">
            Doação {donation.status === 'confirmed' || donation.status === 'completed' ? 'Confirmada' : 'Registrada'}
          </h1>
          <p className="text-muted-foreground">
            Alimento salvo do desperdício
          </p>
        </div>

        {/* Donation Details Card */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {/* Product Info */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                <Package className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Alimento Doado</p>
                <h3 className="font-bold text-lg">{donation.products?.name}</h3>
              </div>
            </div>
            {donation.products?.food_type && (
              <p className="text-sm text-muted-foreground">
                Tipo: {donation.products.food_type}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Quantidade: {donation.quantity} unidade(s)
            </p>
          </div>

          {/* Merchant Info */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <Store className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Comerciante</p>
                <p className="font-medium">
                  {donation.merchant_profile?.store_name ||
                    donation.merchant_profile?.name ||
                    'Comerciante'}
                </p>
                {donation.merchant_profile?.address && (
                  <p className="text-sm text-muted-foreground">
                    {donation.merchant_profile.address}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ONG Info */}
          {donation.ong_profile && (
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <Heart className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">ONG Destinatária</p>
                  <p className="font-medium">
                    {donation.ong_profile?.institution_name ||
                      donation.ong_profile?.name ||
                      'Instituição'}
                  </p>
                  {donation.ong_profile?.address && (
                    <p className="text-sm text-muted-foreground">
                      {donation.ong_profile.address}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Date/Time */}
          <div className="p-4 border-b border-border">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Data da Doação</p>
                  <p className="font-medium">
                    {donatedDate.toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Horário</p>
                  <p className="font-medium">
                    {donatedDate.toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </div>
            {confirmedDate && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Confirmado em {confirmedDate.toLocaleDateString('pt-BR')} às{' '}
                  {confirmedDate.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            )}
          </div>

          {/* Legal Text */}
          <div className="p-4 bg-primary/5">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="text-xs font-medium text-primary mb-1">
                  Segurança Jurídica
                </p>
                <p className="text-sm text-muted-foreground">
                  {donation.legal_confirmation_text}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ID */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            ID da Doação: <span className="font-mono">{donation.id.slice(0, 8)}...</span>
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button variant="gradient" className="w-full" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
        </div>
      </div>
    </div>
  );
}
