import { FilterType } from '@/types';
import { Sparkles, Droplet, Palette, Image, X } from 'lucide-react';
import { Button } from './ui/button';

interface FilterSelectorProps {
  currentFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

const filters: { value: FilterType; label: string; icon: React.ReactNode }[] = [
  { value: 'none', label: 'None', icon: <X className="w-5 h-5" /> },
  { value: 'blur', label: 'Blur BG', icon: <Droplet className="w-5 h-5" /> },
  { value: 'grayscale', label: 'B&W', icon: <Image className="w-5 h-5" /> },
  { value: 'sepia', label: 'Sepia', icon: <Palette className="w-5 h-5" /> },
  { value: 'face-detection', label: 'Face', icon: <Sparkles className="w-5 h-5" /> },
];

export default function FilterSelector({ currentFilter, onFilterChange }: FilterSelectorProps) {
  return (
    <div className="mb-6">
      <h3 className="text-xs font-semibold mb-3 text-gray-400 uppercase tracking-wider">Filters</h3>
      <div className="grid grid-cols-3 gap-3">
        {filters.map((filter) => (
          <Button
            key={filter.value}
            onClick={() => onFilterChange(filter.value)}
            variant="ghost"
            className={`
              flex flex-col items-center justify-center gap-2 h-20
              rounded-xl transition-all duration-200
              ${currentFilter === filter.value 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/70 border border-gray-700'
              }
              hover:scale-105 active:scale-95
            `}
          >
            {filter.icon}
            <span className="text-xs font-medium">{filter.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
