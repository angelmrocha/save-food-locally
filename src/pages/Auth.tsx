import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, Store, ShoppingBag, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

type UserRole = 'merchant' | 'client';
type AuthMode = 'login' | 'signup';

const emailSchema = z.string().email('Email inválido');
const passwordSchema = z.string().min(6, 'Mínimo 6 caracteres');

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [role, setRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate inputs
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      toast({
        title: 'Erro',
        description: emailResult.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      toast({
        title: 'Erro',
        description: passwordResult.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          let message = 'Erro ao fazer login';
          if (error.message.includes('Invalid login credentials')) {
            message = 'Email ou senha incorretos';
          }
          toast({
            title: 'Erro',
            description: message,
            variant: 'destructive',
          });
          return;
        }
        toast({
          title: 'Bem-vindo de volta!',
          description: 'Login realizado com sucesso.',
        });
      } else {
        if (!role) {
          toast({
            title: 'Selecione seu perfil',
            description: 'Escolha se você é comerciante ou cliente.',
            variant: 'destructive',
          });
          return;
        }

        const { error } = await signUp(email, password, role);
        if (error) {
          let message = 'Erro ao criar conta';
          if (error.message.includes('already registered')) {
            message = 'Este email já está cadastrado';
          }
          toast({
            title: 'Erro',
            description: message,
            variant: 'destructive',
          });
          return;
        }
        toast({
          title: 'Conta criada!',
          description: 'Bem-vindo ao Save Food.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="gradient-hero pt-12 pb-8 px-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center shadow-lg">
            <Leaf className="w-7 h-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Save Food</h1>
            <p className="text-sm text-muted-foreground">Juntos contra o desperdício</p>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-foreground">
          {mode === 'login' ? 'Entrar na conta' : 'Criar sua conta'}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {mode === 'login' 
            ? 'Acesse sua conta para continuar'
            : 'Comece a economizar e salvar alimentos'}
        </p>
      </div>

      {/* Form */}
      <div className="flex-1 px-6 pt-6 pb-8">
        {/* Role Selection (only for signup) */}
        {mode === 'signup' && (
          <div className="mb-6">
            <Label className="text-sm font-medium mb-3 block">Eu sou...</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('merchant')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                  role === 'merchant'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border hover:border-primary/30'
                }`}
              >
                <Store className="w-8 h-8" />
                <span className="font-medium text-sm">Comerciante</span>
                <span className="text-xs text-muted-foreground text-center">
                  Quero vender excedentes
                </span>
              </button>

              <button
                type="button"
                onClick={() => setRole('client')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                  role === 'client'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border hover:border-primary/30'
                }`}
              >
                <ShoppingBag className="w-8 h-8" />
                <span className="font-medium text-sm">Cliente</span>
                <span className="text-xs text-muted-foreground text-center">
                  Quero economizar
                </span>
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="h-12"
            />
          </div>

          <Button
            type="submit"
            variant="gradient"
            size="lg"
            className="w-full mt-6"
            disabled={loading || (mode === 'signup' && !role)}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {mode === 'login' ? 'Entrar' : 'Criar conta'}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </Button>
        </form>

        {/* Toggle mode */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            {mode === 'login' ? 'Ainda não tem conta?' : 'Já tem uma conta?'}
          </p>
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login');
              setRole(null);
            }}
            className="text-sm font-semibold text-primary hover:underline mt-1"
          >
            {mode === 'login' ? 'Criar conta grátis' : 'Fazer login'}
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 pb-8 text-center">
        <p className="text-xs text-muted-foreground">
          Ao continuar, você concorda com nossos Termos de Uso e Política de Privacidade
        </p>
      </div>
    </div>
  );
}
