import { useState, useEffect, useCallback, useRef } from 'preact/hooks';

interface PhotoData {
  _key: string;
  url: string;
  caption: string;
}

interface LightboxProps {
  photos: PhotoData[];
}

export default function Lightbox({ photos }: LightboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animating, setAnimating] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // FLIP animation state
  const thumbRectRef = useRef<DOMRect | null>(null);

  const open = useCallback(
    (index: number, thumbEl: HTMLElement) => {
      if (animating) return;
      thumbRectRef.current = thumbEl.getBoundingClientRect();
      setCurrentIndex(index);
      setIsOpen(true);
      // Push history state so back button closes lightbox
      history.pushState({ lightbox: true }, '');
    },
    [animating]
  );

  const close = useCallback(() => {
    if (animating) return;
    setAnimating(true);
    // Reverse FLIP: animate back to thumbnail position
    const overlay = overlayRef.current;
    const img = imgRef.current;
    if (overlay && img && thumbRectRef.current) {
      const currentRect = img.getBoundingClientRect();
      const targetRect = thumbRectRef.current;
      const deltaX = targetRect.left - currentRect.left;
      const deltaY = targetRect.top - currentRect.top;
      const scaleX = targetRect.width / currentRect.width;
      const scaleY = targetRect.height / currentRect.height;

      overlay.style.opacity = '0';
      img.style.transition = `transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.35s ease-out`;
      img.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(${scaleX}, ${scaleY})`;
      img.style.opacity = '0.8';
    }

    setTimeout(() => {
      setIsOpen(false);
      setAnimating(false);
    }, 350);
  }, [animating]);

  const goTo = useCallback(
    (index: number) => {
      if (animating) return;
      setCurrentIndex((index + photos.length) % photos.length);
    },
    [photos.length, animating]
  );

  // Listen for click events on thumbnails
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const trigger = (e.target as HTMLElement).closest('[data-lightbox-trigger]') as HTMLElement | null;
      if (!trigger) return;
      const index = parseInt(trigger.dataset.photoIndex || '0', 10);
      open(index, trigger);
    }

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [open]);

  // Keyboard handling
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          goTo(currentIndex - 1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          goTo(currentIndex + 1);
          break;
        case 'Escape':
          e.preventDefault();
          close();
          break;
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, currentIndex, goTo, close]);

  // Handle browser back button
  useEffect(() => {
    if (!isOpen) return;

    function handlePopState() {
      close();
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isOpen, close]);

  // On image load, apply FLIP from thumbnail position to center
  const handleImageLoad = useCallback(() => {
    if (!thumbRectRef.current || !imgRef.current) return;

    // This is called after the image has loaded and the browser rendered
    // We need to capture the target position and compute the inverse
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const img = imgRef.current;
        if (!img) return;

        // No initial transform needed — let it naturally render at center
        img.style.transition = 'none';
        img.style.transform = 'none';
        img.style.opacity = '1';
      });
    });
  }, []);

  if (!isOpen || photos.length === 0) return null;

  const currentPhoto = photos[currentIndex];

  return (
    <div
      ref={overlayRef}
      class="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(20, 18, 16, 0.92)' }}
      onClick={(e) => {
        if (e.target === overlayRef.current) close();
      }}
    >
      {/* Close button */}
      <button
        onClick={close}
        class="absolute top-6 right-6 text-white/70 hover:text-white transition-colors text-sm uppercase tracking-wider z-10"
        aria-label="Close lightbox"
      >
        Close
      </button>

      {/* Image counter */}
      <div class="absolute top-6 left-6 text-white/50 text-sm z-10">
        {currentIndex + 1} / {photos.length}
      </div>

      {/* Image */}
      <img
        ref={imgRef}
        src={currentPhoto.url}
        alt={currentPhoto.caption || `Photo ${currentIndex + 1}`}
        class="max-h-[85vh] max-w-[90vw] object-contain select-none"
        onLoad={handleImageLoad}
        draggable={false}
      />

      {/* Caption */}
      {currentPhoto.caption && (
        <div class="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 text-sm italic">
          {currentPhoto.caption}
        </div>
      )}

      {/* Prev / Next buttons */}
      {photos.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goTo(currentIndex - 1);
            }}
            class="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors p-4 text-3xl"
            aria-label="Previous photo"
          >
            ‹
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goTo(currentIndex + 1);
            }}
            class="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors p-4 text-3xl"
            aria-label="Next photo"
          >
            ›
          </button>
        </>
      )}
    </div>
  );
}
