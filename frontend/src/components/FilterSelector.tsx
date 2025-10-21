import { FilterType } from '@/types';
import { Sparkles, Droplet, Palette, Image, X } from 'lucide-react';
import { Button } from './ui/button';

interface FilterSelectorProps {
  currentFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

const filters: { value: FilterType; label: string; icon: React.ReactNode }[] = [
  { value: 'none', label: 'None', icon: <X className="w-4 h-4" /> },
  { value: 'blur', label: 'Blur', icon: <Droplet className="w-4 h-4" /> },
  { value: 'grayscale', label: 'B&W', icon: <Image className="w-4 h-4" /> },
  { value: 'sepia', label: 'Sepia', icon: <Palette className="w-4 h-4" /> },
  { value: 'face-detection', label: 'Face', icon: <Sparkles className="w-4 h-4" /> },
];

export default function FilterSelector({ currentFilter, onFilterChange }: FilterSelectorProps) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Filters</h3>
      <div className="flex gap-3 flex-wrap">
        {filters.map((filter) => (
          <Button
            key={filter.value}
            onClick={() => onFilterChange(filter.value)}
            variant={currentFilter === filter.value ? 'default' : 'outline'}
            className="flex items-center gap-2 transition-all hover:scale-105"
          >
            {filter.icon}
            {filter.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
