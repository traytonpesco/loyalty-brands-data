import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Settings2 } from 'lucide-react';

type FontSize = 'small' | 'medium' | 'large' | 'extra-large';

export default function AccessibilitySettings() {
  const [fontSize, setFontSize] = useState<FontSize>('medium');
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    try {
      const savedFontSize = localStorage.getItem('fontSize') as FontSize;
      const savedHighContrast = localStorage.getItem('highContrast') === 'true';
      const savedReducedMotion = localStorage.getItem('reducedMotion') === 'true';
      
      if (savedFontSize) setFontSize(savedFontSize);
      if (savedHighContrast) setHighContrast(savedHighContrast);
      if (savedReducedMotion) setReducedMotion(savedReducedMotion);
    } catch (error) {
      console.error('Failed to load accessibility settings:', error);
    }
  }, []);

  // Apply font size
  useEffect(() => {
    const root = document.documentElement;
    const fontSizeMap = {
      'small': '14px',
      'medium': '16px',
      'large': '18px',
      'extra-large': '20px',
    };
    root.style.fontSize = fontSizeMap[fontSize];
    localStorage.setItem('fontSize', fontSize);
  }, [fontSize]);

  // Apply high contrast
  useEffect(() => {
    const root = document.documentElement;
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    localStorage.setItem('highContrast', String(highContrast));
  }, [highContrast]);

  // Apply reduced motion
  useEffect(() => {
    const root = document.documentElement;
    if (reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
    localStorage.setItem('reducedMotion', String(reducedMotion));
  }, [reducedMotion]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-9 px-0"
          aria-label="Accessibility settings"
        >
          <Settings2 className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Accessibility Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* Font Size */}
          <div className="space-y-3">
            <Label htmlFor="font-size">Font Size</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                id="font-size"
                variant={fontSize === 'small' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFontSize('small')}
              >
                Small
              </Button>
              <Button
                variant={fontSize === 'medium' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFontSize('medium')}
              >
                Medium
              </Button>
              <Button
                variant={fontSize === 'large' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFontSize('large')}
              >
                Large
              </Button>
              <Button
                variant={fontSize === 'extra-large' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFontSize('extra-large')}
              >
                Extra Large
              </Button>
            </div>
          </div>

          {/* High Contrast */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="high-contrast">High Contrast Mode</Label>
              <div className="text-sm text-muted-foreground">
                Increases color contrast for better visibility
              </div>
            </div>
            <Button
              id="high-contrast"
              variant={highContrast ? 'default' : 'outline'}
              size="sm"
              onClick={() => setHighContrast(!highContrast)}
            >
              {highContrast ? 'On' : 'Off'}
            </Button>
          </div>

          {/* Reduced Motion */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="reduced-motion">Reduced Motion</Label>
              <div className="text-sm text-muted-foreground">
                Minimizes animations and transitions
              </div>
            </div>
            <Button
              id="reduced-motion"
              variant={reducedMotion ? 'default' : 'outline'}
              size="sm"
              onClick={() => setReducedMotion(!reducedMotion)}
            >
              {reducedMotion ? 'On' : 'Off'}
            </Button>
          </div>

          {/* Info */}
          <div className="text-xs text-muted-foreground pt-2 border-t">
            <p>These settings are saved locally and will persist across sessions.</p>
            <p className="mt-2">
              For additional accessibility features, please refer to your browser's accessibility settings.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

