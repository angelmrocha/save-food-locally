import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  LogOut, 
  ChevronRight,
  Store,
  ShoppingBag,
  Leaf,
  Loader2
} from 'lucide-react';

export default function Profile() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    whatsapp: profile?.whatsapp || '',
    address: profile?.address || '',
    store_name: profile?.store_name || '',
  });

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        name: formData.name,
        whatsapp: formData.whatsapp,
        address: formData.address,
        store_name: formData.store_name,
      })
      .eq('id', user.id);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as alterações.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Salvo!',
        description: 'Seu perfil foi atualizado.',
      });
      await refreshProfile();
      setEditing(false);
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const isMerchant = profile?.role === 'merchant';

  return (
    <div className="min-h-screen bg-background pb-nav">
      <Header title="Meu Perfil" showLocation={false} />

      <div className="px-4 py-6 space-y-6">
        {/* Profile Header */}
        <div className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border">
          <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center">
            <User className="w-8 h-8 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-lg">
              {profile?.name || 'Usuário'}
            </h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {isMerchant ? (
                <>
                  <Store className="w-4 h-4" />
                  <span>Comerciante</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Cliente</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 bg-accent rounded-xl text-center">
            <Leaf className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-primary">R$ 0</p>
            <p className="text-xs text-muted-foreground">
              Desperdício evitado
            </p>
          </div>
          <div className="p-4 bg-accent rounded-xl text-center">
            <ShoppingBag className="w-6 h-6 text-secondary mx-auto mb-2" />
            <p className="text-2xl font-bold text-secondary">0</p>
            <p className="text-xs text-muted-foreground">
              {isMerchant ? 'Produtos vendidos' : 'Compras realizadas'}
            </p>
          </div>
        </div>

        {/* Edit Form */}
        {editing ? (
          <div className="space-y-4 p-4 bg-card rounded-xl border border-border">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Seu nome"
              />
            </div>

            {isMerchant && (
              <div className="space-y-2">
                <Label htmlFor="store_name">Nome da loja</Label>
                <Input
                  id="store_name"
                  value={formData.store_name}
                  onChange={(e) =>
                    setFormData({ ...formData, store_name: e.target.value })
                  }
                  placeholder="Nome da sua loja"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={formData.whatsapp}
                onChange={(e) =>
                  setFormData({ ...formData, whatsapp: e.target.value })
                }
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="Seu endereço"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setEditing(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="gradient"
                className="flex-1"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Salvar'
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <button
              onClick={() => setEditing(true)}
              className="w-full flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:border-primary/30 transition-all"
            >
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1 text-left">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{profile?.email || user?.email}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            <button
              onClick={() => setEditing(true)}
              className="w-full flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:border-primary/30 transition-all"
            >
              <Phone className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1 text-left">
                <p className="text-sm text-muted-foreground">WhatsApp</p>
                <p className="font-medium">
                  {profile?.whatsapp || 'Adicionar'}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            <button
              onClick={() => setEditing(true)}
              className="w-full flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:border-primary/30 transition-all"
            >
              <MapPin className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1 text-left">
                <p className="text-sm text-muted-foreground">Endereço</p>
                <p className="font-medium">
                  {profile?.address || 'Adicionar'}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        )}

        {/* Merchant Dashboard Link */}
        {isMerchant && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate('/merchant')}
          >
            <Store className="w-5 h-5" />
            Ir para Painel do Comerciante
          </Button>
        )}

        {/* Logout */}
        <Button
          variant="ghost"
          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5" />
          Sair da conta
        </Button>
      </div>

      <BottomNav />
    </div>
  );
}
