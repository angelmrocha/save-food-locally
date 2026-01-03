import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import {
  Plus,
  Package,
  Gift,
  Leaf,
  TrendingUp,
  Edit2,
  Trash2,
  LogOut,
  Store,
  ArrowLeft,
  Loader2,
} from 'lucide-react';

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
  active: boolean;
}

interface Order {
  id: string;
  total_amount: number;
  created_at: string;
}

const categories = ['Bakery', 'Produce', 'Meat', 'Dairy', 'Other'];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export default function MerchantDashboard() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Product form state
  const [productTab, setProductTab] = useState<'surprise' | 'single'>('surprise');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    original_price: '',
    promo_price: '',
    quantity: '1',
    category: 'Other',
    pickup_time: '',
    expiration_date: '',
  });

  useEffect(() => {
    if (user && profile?.role === 'merchant') {
      fetchData();
    }
  }, [user, profile]);

  const fetchData = async () => {
    setLoading(true);

    // Fetch products
    const { data: productsData } = await supabase
      .from('products')
      .select('*')
      .eq('merchant_id', user!.id)
      .order('created_at', { ascending: false });

    // Fetch today's orders
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: ordersData } = await supabase
      .from('orders')
      .select('*')
      .eq('merchant_id', user!.id)
      .gte('created_at', today.toISOString());

    setProducts(productsData || []);
    setOrders(ordersData || []);
    setLoading(false);
  };

  const handleCreateProduct = async () => {
    if (!user) return;

    setSaving(true);

    const isSurpriseBag = productTab === 'surprise';
    const productData = {
      merchant_id: user.id,
      name: isSurpriseBag ? 'Sacola Surpresa' : formData.name,
      description: isSurpriseBag ? 'Sacola com produtos variados' : formData.description,
      original_price: parseFloat(formData.original_price) || 0,
      promo_price: parseFloat(formData.promo_price) || 0,
      quantity: parseInt(formData.quantity) || 1,
      category: (isSurpriseBag ? 'Surprise Bag' : formData.category) as 'Bakery' | 'Produce' | 'Meat' | 'Dairy' | 'Surprise Bag' | 'Other',
      is_surprise_bag: isSurpriseBag,
      pickup_time: formData.pickup_time || null,
      active: true,
    };

    const { error } = await supabase.from('products').insert([productData]);

    if (error) {
      console.error('Error creating product:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o produto.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Produto criado!',
        description: 'Seu produto já está disponível para reserva.',
      });
      setDialogOpen(false);
      resetForm();
      fetchData();
    }

    setSaving(false);
  };

  const handleDeleteProduct = async (productId: string) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o produto.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Excluído',
        description: 'Produto removido com sucesso.',
      });
      fetchData();
    }
  };

  const handleToggleActive = async (productId: string, currentActive: boolean) => {
    const { error } = await supabase
      .from('products')
      .update({ active: !currentActive })
      .eq('id', productId);

    if (!error) {
      fetchData();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      original_price: '',
      promo_price: '',
      quantity: '1',
      category: 'Other',
      pickup_time: '',
      expiration_date: '',
    });
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  // Calculate stats
  const todaySales = orders.reduce((sum, order) => sum + order.total_amount, 0);
  const wastePreventedValue = products
    .filter((p) => !p.active || p.quantity === 0)
    .reduce((sum, p) => sum + p.original_price * (p.quantity || 1), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner text="Carregando..." />
      </div>
    );
  }

  // Check if merchant profile is complete
  const isProfileComplete = profile?.store_name && profile?.whatsapp;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('/feed')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Store className="w-5 h-5 text-primary" />
            <span className="font-bold">Painel do Comerciante</span>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Profile Warning */}
        {!isProfileComplete && (
          <div className="p-4 bg-secondary/10 border border-secondary/30 rounded-xl">
            <p className="text-sm text-secondary font-medium">
              ⚠️ Complete seu perfil
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Adicione nome da loja e WhatsApp para receber reservas.
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={() => navigate('/profile')}
            >
              Completar perfil
            </Button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 bg-card rounded-xl border border-border">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span className="text-xs text-muted-foreground">Vendas Hoje</span>
            </div>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(todaySales)}
            </p>
          </div>
          <div className="p-4 bg-card rounded-xl border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Leaf className="w-5 h-5 text-success" />
              <span className="text-xs text-muted-foreground">
                Desperdício Evitado
              </span>
            </div>
            <p className="text-2xl font-bold text-success">
              {formatCurrency(wastePreventedValue)}
            </p>
          </div>
        </div>

        {/* New Product Button */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gradient" size="lg" className="w-full">
              <Plus className="w-5 h-5" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Adicionar Produto</DialogTitle>
            </DialogHeader>

            <Tabs
              value={productTab}
              onValueChange={(v) => setProductTab(v as 'surprise' | 'single')}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="surprise" className="gap-2">
                  <Gift className="w-4 h-4" />
                  Sacola Surpresa
                </TabsTrigger>
                <TabsTrigger value="single" className="gap-2">
                  <Package className="w-4 h-4" />
                  Produto Único
                </TabsTrigger>
              </TabsList>

              <TabsContent value="surprise" className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  Crie uma sacola surpresa com itens variados. O cliente não
                  saberá o conteúdo, mas economizará muito!
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Preço Original</Label>
                    <Input
                      type="number"
                      placeholder="R$ 40,00"
                      value={formData.original_price}
                      onChange={(e) =>
                        setFormData({ ...formData, original_price: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Preço Promo</Label>
                    <Input
                      type="number"
                      placeholder="R$ 15,00"
                      value={formData.promo_price}
                      onChange={(e) =>
                        setFormData({ ...formData, promo_price: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Quantidade</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) =>
                        setFormData({ ...formData, quantity: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Horário Retirada</Label>
                    <Input
                      placeholder="18h às 20h"
                      value={formData.pickup_time}
                      onChange={(e) =>
                        setFormData({ ...formData, pickup_time: e.target.value })
                      }
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="single" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Nome do Produto</Label>
                  <Input
                    placeholder="Pão francês (10 unidades)"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    placeholder="Descreva o produto..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(v) =>
                      setFormData({ ...formData, category: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Preço Original</Label>
                    <Input
                      type="number"
                      placeholder="R$ 20,00"
                      value={formData.original_price}
                      onChange={(e) =>
                        setFormData({ ...formData, original_price: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Preço Promo</Label>
                    <Input
                      type="number"
                      placeholder="R$ 8,00"
                      value={formData.promo_price}
                      onChange={(e) =>
                        setFormData({ ...formData, promo_price: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Quantidade</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) =>
                        setFormData({ ...formData, quantity: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Validade</Label>
                    <Input
                      type="date"
                      value={formData.expiration_date}
                      onChange={(e) =>
                        setFormData({ ...formData, expiration_date: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Horário Retirada</Label>
                  <Input
                    placeholder="18h às 20h"
                    value={formData.pickup_time}
                    onChange={(e) =>
                      setFormData({ ...formData, pickup_time: e.target.value })
                    }
                  />
                </div>
              </TabsContent>
            </Tabs>

            <Button
              variant="gradient"
              className="w-full mt-4"
              onClick={handleCreateProduct}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Criar Produto
                </>
              )}
            </Button>
          </DialogContent>
        </Dialog>

        {/* Products List */}
        <section>
          <h2 className="font-bold text-lg mb-4">
            Seus Produtos ({products.length})
          </h2>

          {products.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <Package className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum produto ainda</p>
              <p className="text-sm text-muted-foreground mt-1">
                Clique em "Novo Produto" para começar
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {products.map((product) => (
                <div
                  key={product.id}
                  className={`p-4 bg-card rounded-xl border transition-opacity ${
                    product.active
                      ? 'border-border'
                      : 'border-border opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {product.is_surprise_bag && (
                          <span className="text-lg">🎁</span>
                        )}
                        <h3 className="font-semibold">{product.name}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {product.quantity} disponíveis •{' '}
                        {formatCurrency(product.promo_price)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          handleToggleActive(product.id, product.active)
                        }
                        className={product.active ? '' : 'text-muted-foreground'}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
