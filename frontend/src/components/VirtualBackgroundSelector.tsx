'use client';

import { useState } from 'react';
import { Image as ImageIcon, Sparkles, X } from 'lucide-react';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export type VirtualBackgroundType = 'none' | 'blur' | 'image';

interface VirtualBackgroundSelectorProps {
  currentBackground: VirtualBackgroundType;
  onBackgroundChange: (bg: VirtualBackgroundType, image?: string) => void;
}

const backgrounds = [
  { value: 'none' as const, label: 'None', icon: <X className="w-4 h-4" /> },
  { value: 'blur' as const, label: 'Blur', icon: <Sparkles className="w-4 h-4" /> },
  { value: 'image' as const, label: 'Custom', icon: <ImageIcon className="w-4 h-4" /> },
];

const presetImages = [
  { url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1280&h=720&fit=crop', name: 'Mountains' },
  { url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1280&h=720&fit=crop', name: 'Stars' },
  { url: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1280&h=720&fit=crop', name: 'Gradient' },
  { url: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=1280&h=720&fit=crop', name: 'Beach' },
];

export default function VirtualBackgroundSelector({
  currentBackground,
  onBackgroundChange,
}: VirtualBackgroundSelectorProps) {
  const [showImagePicker, setShowImagePicker] = useState(false);

  const handleBackgroundChange = (bg: VirtualBackgroundType) => {
    if (bg === 'image') {
      setShowImagePicker(true);
    } else {
      onBackgroundChange(bg);
      setShowImagePicker(false);
    }
  };

  const handleImageSelect = (imageUrl: string) => {
    onBackgroundChange('image', imageUrl);
    setShowImagePicker(false);
  };

  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Virtual Background</h3>
      <div className="flex gap-3 flex-wrap">
        {backgrounds.map((bg) => (
          <Button
            key={bg.value}
            onClick={() => handleBackgroundChange(bg.value)}
            variant={currentBackground === bg.value ? 'default' : 'outline'}
            className="flex items-center gap-2 transition-all hover:scale-105"
          >
            {bg.icon}
            {bg.label}
          </Button>
        ))}
      </div>

      {/* Image Picker Modal */}
      <AnimatePresence>
        {showImagePicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowImagePicker(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border rounded-xl p-6 max-w-2xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Choose Background</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowImagePicker(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {presetImages.map((img, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative cursor-pointer rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all"
                    onClick={() => handleImageSelect(img.url)}
                  >
                    <img
                      src={img.url}
                      alt={img.name}
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                      <p className="text-white text-sm font-semibold">{img.name}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">Or enter custom URL:</p>
                <input
                  type="text"
                  placeholder="https://example.com/image.jpg"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.target as HTMLInputElement;
                      if (input.value) {
                        handleImageSelect(input.value);
                      }
                    }
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
