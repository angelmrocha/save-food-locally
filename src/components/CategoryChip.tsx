import { cn } from '@/lib/utils';
import { 
  Croissant, 
  Apple, 
  Beef, 
  Milk, 
  Gift, 
  Package 
} from 'lucide-react';

const categoryIcons: Record<string, React.ElementType> = {
  'Bakery': Croissant,
  'Produce': Apple,
  'Meat': Beef,
  'Dairy': Milk,
  'Surprise Bag': Gift,
  'Other': Package,
};

const categoryLabels: Record<string, string> = {
  'Bakery': 'Padaria',
  'Produce': 'Hortifruti',
  'Meat': 'Carnes',
  'Dairy': 'Laticínios',
  'Surprise Bag': 'Surpresa',
  'Other': 'Outros',
};

interface CategoryChipProps {
  category: string;
  isActive?: boolean;
  onClick?: () => void;
  count?: number;
}

export function CategoryChip({ category, isActive, onClick, count }: CategoryChipProps) {
  const Icon = categoryIcons[category] || Package;
  const label = categoryLabels[category] || category;
  const isSurprise = category === 'Surprise Bag';

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 whitespace-nowrap',
        isActive
          ? isSurprise
            ? 'gradient-surprise text-primary-foreground shadow-md'
            : 'bg-primary text-primary-foreground shadow-md'
          : 'bg-card border border-border text-foreground hover:bg-accent hover:border-primary/30',
        isSurprise && !isActive && 'border-surprise/30 text-surprise'
      )}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={cn(
            'px-1.5 py-0.5 rounded-full text-xs font-bold',
            isActive ? 'bg-primary-foreground/20' : 'bg-muted'
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
