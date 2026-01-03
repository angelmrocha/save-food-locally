import { Leaf, MapPin, Bell } from 'lucide-react';
import { useLocation as useGeoLocation } from '@/contexts/LocationContext';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  title?: string;
  showLocation?: boolean;
}

export function Header({ title, showLocation = true }: HeaderProps) {
  const { location, loading, requestLocation } = useGeoLocation();

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="flex items-center justify-between px-4 h-14">
        {/* Logo / Title */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <Leaf className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">
            {title || 'Save Food'}
          </span>
        </div>

        {/* Location & Actions */}
        <div className="flex items-center gap-2">
          {showLocation && (
            <button
              onClick={requestLocation}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-accent"
            >
              <MapPin className="w-3.5 h-3.5 text-primary" />
              {loading ? (
                <span>Localizando...</span>
              ) : location ? (
                <span className="max-w-24 truncate">Próximo a você</span>
              ) : (
                <span>Ativar local</span>
              )}
            </button>
          )}
          
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-secondary" />
          </Button>
        </div>
      </div>
    </header>
  );
}
