import { cn } from '@/lib/utils';
import { Package, Gift, Heart } from 'lucide-react';

type ProductStatus = 'available' | 'food_day' | 'donated';

interface ProductStatusBadgeProps {
  status: ProductStatus;
  className?: string;
}

const statusConfig = {
  available: {
    label: 'Disponível para venda',
    icon: Package,
    className: 'bg-primary/10 text-primary border-primary/30',
  },
  food_day: {
    label: 'Doação Prioritária – Food Day',
    icon: Gift,
    className: 'bg-secondary/10 text-secondary border-secondary/30',
  },
  donated: {
    label: 'Doação Confirmada',
    icon: Heart,
    className: 'bg-success/10 text-success border-success/30',
  },
};

export function ProductStatusBadge({ status, className }: ProductStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
        config.className,
        className
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </div>
  );
}
