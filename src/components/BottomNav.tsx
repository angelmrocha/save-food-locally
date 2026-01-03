import { Home, Grid3X3, Gift, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/feed', icon: Home, label: 'Início' },
  { path: '/categories', icon: Grid3X3, label: 'Categorias' },
  { path: '/surprise-bags', icon: Gift, label: 'Surpresa' },
  { path: '/profile', icon: User, label: 'Perfil' },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          const isSurprise = item.path === '/surprise-bags';

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-200',
                isActive
                  ? isSurprise
                    ? 'text-surprise'
                    : 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div
                className={cn(
                  'relative p-1.5 rounded-xl transition-all duration-200',
                  isActive && (isSurprise ? 'bg-surprise/10' : 'bg-primary/10'),
                  isSurprise && !isActive && 'animate-pulse'
                )}
              >
                <Icon
                  className={cn(
                    'w-5 h-5 transition-transform duration-200',
                    isActive && 'scale-110'
                  )}
                />
                {isSurprise && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-secondary animate-pulse" />
                )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
