import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
import { ProductStatusBadge } from '@/components/ProductStatusBadge';
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
  Clock,
  Heart,
  Bell,
} from 'lucide-react';

type ProductStatus = 'available' | 'food_day' | 'donated';

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
  status: ProductStatus;
  food_day_enabled: boolean;
  food_day_cutoff_time: string | null;
  food_type: string | null;
}

interface Order {
  id: string;
  total_amount: number;
  created_at: string;
}

interface Donation {
  id: string;
  quantity: number;
  status: string;
  donated_at: string;
  products?: {
    name: string;
  };
  ong_profile?: {
    institution_name: string | null;
    name: string | null;
  };
}

const categories = ['Bakery', 'Produce', 'Meat', 'Dairy', 'Other'];
const foodTypes = ['Padaria', 'Frutas e Verduras', 'Carnes', 'Laticínios', 'Refeições', 'Outros'];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export default function MerchantDashboard() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
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
    food_type: '',
    food_day_enabled: true,
    food_day_cutoff_time: '20:00',
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

    // Fetch donations
    const { data: donationsData } = await supabase
      .from('donations')
      .select(`
        *,
        products (name)
      `)
      .eq('merchant_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(10);

    setProducts((productsData || []) as Product[]);
    setOrders(ordersData || []);
    setDonations(donationsData || []);
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
      food_type: formData.food_type || null,
      food_day_enabled: formData.food_day_enabled,
      food_day_cutoff_time: formData.food_day_cutoff_time || '20:00:00',
      active: true,
      status: 'available' as const,
    };

    let error;
    if (editingProduct) {
      const result = await supabase
        .from('products')
        .update(productData)
        .eq('id', editingProduct.id);
      error = result.error;
    } else {
      const result = await supabase.from('products').insert([productData]);
      error = result.error;
    }

    if (error) {
      console.error('Error saving product:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o produto.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: editingProduct ? 'Produto atualizado!' : 'Produto criado!',
        description: 'Seu produto já está disponível.',
      });
      setDialogOpen(false);
      setEditingProduct(null);
      resetForm();
      fetchData();
    }

    setSaving(false);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductTab(product.is_surprise_bag ? 'surprise' : 'single');
    setFormData({
      name: product.name,
      description: product.description || '',
      original_price: product.original_price.toString(),
      promo_price: product.promo_price.toString(),
      quantity: product.quantity.toString(),
      category: product.category,
      pickup_time: product.pickup_time || '',
      expiration_date: '',
      food_type: product.food_type || '',
      food_day_enabled: product.food_day_enabled,
      food_day_cutoff_time: product.food_day_cutoff_time?.slice(0, 5) || '20:00',
    });
    setDialogOpen(true);
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

  const handleActivateFoodDay = async (product: Product) => {
    const { error } = await supabase
      .from('products')
      .update({
        status: 'food_day',
        active: false,
      })
      .eq('id', product.id);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível ativar o Food Day.',
        variant: 'destructive',
      });
    } else {
      // Create a donation record
      await supabase.from('donations').insert([
        {
          product_id: product.id,
          merchant_id: user!.id,
          quantity: product.quantity,
          status: 'notified',
        },
      ]);

      toast({
        title: 'Food Day ativado!',
        description: 'ONG mais próxima será notificada para retirada.',
      });
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
      food_type: '',
      food_day_enabled: true,
      food_day_cutoff_time: '20:00',
    });
    setEditingProduct(null);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  // Calculate stats
  const todaySales = orders.reduce((sum, order) => sum + order.total_amount, 0);
  const wastePreventedValue = products
    .filter((p) => p.status === 'donated' || p.status === 'food_day')
    .reduce((sum, p) => sum + p.original_price * (p.quantity || 1), 0);
  const totalDonations = donations.filter((d) => d.status === 'confirmed' || d.status === 'completed').length;

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
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 bg-card rounded-xl border border-border">
            <div className="flex items-center gap-1 mb-1">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-[10px] text-muted-foreground">Vendas</span>
            </div>
            <p className="text-lg font-bold text-primary">
              {formatCurrency(todaySales)}
            </p>
          </div>
          <div className="p-3 bg-card rounded-xl border border-border">
            <div className="flex items-center gap-1 mb-1">
              <Leaf className="w-4 h-4 text-success" />
              <span className="text-[10px] text-muted-foreground">Salvo</span>
            </div>
            <p className="text-lg font-bold text-success">
              {formatCurrency(wastePreventedValue)}
            </p>
          </div>
          <div className="p-3 bg-card rounded-xl border border-border">
            <div className="flex items-center gap-1 mb-1">
              <Heart className="w-4 h-4 text-secondary" />
              <span className="text-[10px] text-muted-foreground">Doações</span>
            </div>
            <p className="text-lg font-bold text-secondary">{totalDonations}</p>
          </div>
        </div>

        {/* AI Info */}
        <div className="p-3 bg-muted/50 rounded-xl border border-border">
          <p className="text-xs text-muted-foreground">
            🤖 <strong>IA do SalvaFood:</strong> Regras heurísticas ativas (horário, histórico, tipo).
            Evolução para IA preditiva em breve.
          </p>
        </div>

        {/* New Product Button */}
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button variant="gradient" size="lg" className="w-full">
              <Plus className="w-5 h-5" />
              Nova Sacola / Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Editar Produto' : 'Adicionar Produto'}
              </DialogTitle>
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

                <div className="space-y-2">
                  <Label>Tipo de Alimento</Label>
                  <Select
                    value={formData.food_type}
                    onValueChange={(v) => setFormData({ ...formData, food_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {foodTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
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

            {/* Food Day Section */}
            <div className="mt-4 p-4 bg-secondary/10 rounded-xl border border-secondary/30">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="food_day_enabled"
                  checked={formData.food_day_enabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, food_day_enabled: checked as boolean })
                  }
                />
                <div className="flex-1">
                  <Label htmlFor="food_day_enabled" className="text-sm font-medium cursor-pointer">
                    Ativar Food Day automaticamente
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Se não for vendido até o horário limite, será doado para ONGs
                  </p>
                </div>
              </div>

              {formData.food_day_enabled && (
                <div className="mt-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <Label className="text-sm">Horário limite:</Label>
                  <Input
                    type="time"
                    value={formData.food_day_cutoff_time}
                    onChange={(e) =>
                      setFormData({ ...formData, food_day_cutoff_time: e.target.value })
                    }
                    className="w-24"
                  />
                </div>
              )}
            </div>

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
                  {editingProduct ? 'Salvar Alterações' : 'Criar Produto'}
                </>
              )}
            </Button>
          </DialogContent>
        </Dialog>

        {/* Recent Donations Alert */}
        {donations.length > 0 && (
          <div className="p-4 bg-primary/5 rounded-xl border border-primary/30">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Doações Recentes</h3>
            </div>
            <div className="space-y-2">
              {donations.slice(0, 3).map((donation) => (
                <div
                  key={donation.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span>{donation.products?.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    donation.status === 'confirmed' || donation.status === 'completed'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-secondary/10 text-secondary'
                  }`}>
                    {donation.status === 'confirmed' || donation.status === 'completed'
                      ? 'Confirmada'
                      : 'Pendente'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

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
                Clique em "Nova Sacola / Produto" para começar
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {products.map((product) => (
                <div
                  key={product.id}
                  className={`p-4 bg-card rounded-xl border transition-all ${
                    product.status === 'food_day'
                      ? 'border-secondary/50 bg-secondary/5'
                      : product.status === 'donated'
                      ? 'border-primary/50 bg-primary/5'
                      : 'border-border'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
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
                      {product.food_type && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Tipo: {product.food_type}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditProduct(product)}
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

                  {/* Status Badge */}
                  <div className="flex items-center justify-between">
                    <ProductStatusBadge status={product.status} />

                    {/* Food Day Button */}
                    {product.status === 'available' && product.quantity > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleActivateFoodDay(product)}
                        className="text-secondary border-secondary/50 hover:bg-secondary/10"
                      >
                        <Gift className="w-4 h-4" />
                        Ativar Food Day
                      </Button>
                    )}
                  </div>

                  {/* Food Day Info */}
                  {product.food_day_enabled && product.status === 'available' && (
                    <p className="text-xs text-muted-foreground mt-2">
                      ⏰ Food Day ativa às {product.food_day_cutoff_time?.slice(0, 5) || '20:00'} se não vendido
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
