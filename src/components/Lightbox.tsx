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
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const thumbRectRef = useRef<DOMRect | null>(null);

  const resetView = useCallback(() => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  }, []);

  const open = useCallback(
    (index: number, thumbEl: HTMLElement) => {
      if (animating) return;
      thumbRectRef.current = thumbEl.getBoundingClientRect();
      setCurrentIndex(index);
      resetView();
      setIsOpen(true);
      history.pushState({ lightbox: true }, '');
    },
    [animating, resetView]
  );

  const close = useCallback(() => {
    if (animating) return;
    setAnimating(true);
    resetView();
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
  }, [animating, resetView]);

  const goTo = useCallback(
    (index: number) => {
      if (animating) return;
      resetView();
      setCurrentIndex((index + photos.length) % photos.length);
    },
    [photos.length, animating, resetView]
  );

  // Click on thumbnail to open
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

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        case 'ArrowLeft': e.preventDefault(); goTo(currentIndex - 1); break;
        case 'ArrowRight': e.preventDefault(); goTo(currentIndex + 1); break;
        case 'Escape': e.preventDefault(); close(); break;
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, currentIndex, goTo, close]);

  // Browser back button
  useEffect(() => {
    if (!isOpen) return;
    function handlePopState() { close(); }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isOpen, close]);

  // Mouse wheel zoom — centered in place
  useEffect(() => {
    if (!isOpen) return;
    function handleWheel(e: WheelEvent) {
      e.preventDefault();
      setZoom((prev) => {
        const delta = e.deltaY > 0 ? 0.85 : 1.15;
        const next = Math.min(Math.max(prev * delta, 0.5), 5);
        // Reset pan when zooming back to 1x
        if (next <= 1) {
          setPanX(0);
          setPanY(0);
        }
        return next;
      });
    }
    const el = overlayRef.current;
    if (el) {
      el.addEventListener('wheel', handleWheel, { passive: false });
      return () => el.removeEventListener('wheel', handleWheel);
    }
  }, [isOpen]);

  // Mouse drag when zoomed
  useEffect(() => {
    if (!isOpen || zoom <= 1) return;
    function handleMouseDown(e: MouseEvent) {
      if (e.button !== 0) return;
      setIsPanning(true);
      panStartRef.current = { x: e.clientX, y: e.clientY, panX, panY };
    }
    function handleMouseMove(e: MouseEvent) {
      if (!isPanning) return;
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setPanX(panStartRef.current.panX + dx);
      setPanY(panStartRef.current.panY + dy);
    }
    function handleMouseUp() {
      setIsPanning(false);
    }
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isOpen, zoom, panX, panY, isPanning]);

  const handleImageLoad = useCallback(() => {
    if (!thumbRectRef.current || !imgRef.current) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const img = imgRef.current;
        if (!img) return;
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
      {/* Close */}
      <button
        onClick={close}
        class="absolute top-6 right-6 text-white/70 hover:text-white transition-colors text-sm tracking-wider z-10"
        aria-label="關閉燈箱"
      >
        關閉
      </button>

      {/* Counter */}
      <div class="absolute top-6 left-6 text-white/50 text-sm z-10">
        {currentIndex + 1} / {photos.length}
      </div>

      {/* Caption - top-left under counter */}
      {currentPhoto.caption && (
        <div class="absolute top-14 left-6 text-white text-xl font-medium z-10 drop-shadow-md">
          {currentPhoto.caption}
        </div>
      )}

      {/* Zoom hint */}
      {zoom === 1 && (
        <div class="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/30 text-xs z-10">
          滾輪縮放 · 點擊拖曳
        </div>
      )}

      {/* Image */}
      <img
        ref={imgRef}
        src={currentPhoto.url}
        alt={currentPhoto.caption || `照片 ${currentIndex + 1}`}
        class="max-h-[85vh] max-w-[90vw] object-contain select-none"
        style={{
          transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
          transformOrigin: 'center center',
          cursor: zoom > 1 ? (isPanning ? 'grabbing' : 'grab') : 'zoom-in',
        }}
        onLoad={handleImageLoad}
        draggable={false}
        onDblClick={() => {
          if (zoom > 1) {
            resetView();
          } else {
            setZoom(2.5);
          }
        }}
      />

      {/* Prev / Next */}
      {photos.length > 1 && zoom <= 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); goTo(currentIndex - 1); }}
            class="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors p-4 text-3xl"
            aria-label="上一張"
          >
            ‹
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); goTo(currentIndex + 1); }}
            class="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors p-4 text-3xl"
            aria-label="下一張"
          >
            ›
          </button>
        </>
      )}
    </div>
  );
}
