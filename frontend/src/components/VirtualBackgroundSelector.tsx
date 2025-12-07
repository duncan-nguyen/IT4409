'use client';

import { useState, useRef } from 'react';
import { Image as ImageIcon, Sparkles, X, Upload } from 'lucide-react';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export type VirtualBackgroundType = 'none' | 'blur' | 'image';

interface VirtualBackgroundSelectorProps {
  currentBackground: VirtualBackgroundType;
  onBackgroundChange: (bg: VirtualBackgroundType, image?: string) => void;
}

const backgrounds = [
  { value: 'none' as const, label: 'No BG', icon: <X className="w-5 h-5" /> },
  { value: 'blur' as const, label: 'Blur BG', icon: <Sparkles className="w-5 h-5" /> },
  { value: 'image' as const, label: 'Custom', icon: <ImageIcon className="w-5 h-5" /> },
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        handleImageSelect(imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="mb-6">
      <h3 className="text-xs font-semibold mb-3 text-gray-400 uppercase tracking-wider">Virtual Background</h3>
      <div className="grid grid-cols-3 gap-3">
        {backgrounds.map((bg) => (
          <Button
            key={bg.value}
            onClick={() => handleBackgroundChange(bg.value)}
            variant="ghost"
            className={`
              flex flex-col items-center justify-center gap-2 h-20
              rounded-xl transition-all duration-200
              ${currentBackground === bg.value 
                ? 'bg-purple-600 text-white hover:bg-purple-700' 
                : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/70 border border-gray-700'
              }
              hover:scale-105 active:scale-95
            `}
          >
            {bg.icon}
            <span className="text-xs font-medium">{bg.label}</span>
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
              className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-2xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Choose Background</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowImagePicker(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Upload Button */}
              <div className="mb-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  Upload Your Image
                </Button>
              </div>

              {/* Preset Images */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-400 mb-3">PRESET BACKGROUNDS</h4>
                <div className="grid grid-cols-2 gap-4">
                  {presetImages.map((img, idx) => (
                    <motion.div
                      key={idx}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="relative cursor-pointer rounded-lg overflow-hidden border-2 border-gray-700 hover:border-purple-500 transition-all"
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
              </div>

              {/* Custom URL Input */}
              <div>
                <h4 className="text-sm font-semibold text-gray-400 mb-2">OR ENTER URL</h4>
                <input
                  type="text"
                  placeholder="https://example.com/image.jpg"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
