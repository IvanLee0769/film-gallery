import { useState, useEffect, useCallback, useRef } from 'preact/hooks';

interface PhotoData {
  _key: string;
  url: string;
  caption: string;
}

interface CommentData {
  _id: string;
  nickname: string;
  content: string;
  createdAt: string;
}

interface LightboxProps {
  photos: PhotoData[];
  rollId: string;
}

export default function Lightbox({ photos, rollId }: LightboxProps) {
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

  // Comments state
  const [showComments, setShowComments] = useState(true);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [content, setContent] = useState('');
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [submitMsg, setSubmitMsg] = useState('');

  const currentPhoto = photos[currentIndex];

  const resetView = useCallback(() => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  }, []);

  const fetchComments = useCallback(async (photoKey: string) => {
    setCommentLoading(true);
    try {
      const res = await fetch(`/api/comment?rollId=${rollId}&photoKey=${photoKey}`);
      if (res.ok) setComments(await res.json());
    } catch { /* ignore */ }
    setCommentLoading(false);
  }, [rollId]);

  const open = useCallback(
    (index: number, thumbEl: HTMLElement) => {
      if (animating) return;
      thumbRectRef.current = thumbEl.getBoundingClientRect();
      setCurrentIndex(index);
      resetView();
      setIsOpen(true);
      fetchComments(photos[index]._key);
      history.pushState({ lightbox: true }, '');
    },
    [animating, resetView, fetchComments, photos]
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
      setSubmitStatus('idle');
      setSubmitMsg('');
    }, 350);
  }, [animating, resetView]);

  const goTo = useCallback(
    (index: number) => {
      if (animating) return;
      resetView();
      const newIndex = (index + photos.length) % photos.length;
      setCurrentIndex(newIndex);
      fetchComments(photos[newIndex]._key);
      setSubmitStatus('idle');
      setSubmitMsg('');
    },
    [photos.length, animating, resetView, fetchComments, photos]
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

  // Keyboard
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;
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

  // Browser back
  useEffect(() => {
    if (!isOpen) return;
    function handlePopState() { close(); }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isOpen, close]);

  // Wheel zoom
  useEffect(() => {
    if (!isOpen) return;
    function handleWheel(e: WheelEvent) {
      e.preventDefault();
      setZoom((prev) => {
        const delta = e.deltaY > 0 ? 0.85 : 1.15;
        const next = Math.min(Math.max(prev * delta, 0.5), 5);
        if (next <= 1) { setPanX(0); setPanY(0); }
        return next;
      });
    }
    const el = overlayRef.current;
    if (el) {
      el.addEventListener('wheel', handleWheel, { passive: false });
      return () => el.removeEventListener('wheel', handleWheel);
    }
  }, [isOpen]);

  // Drag when zoomed
  useEffect(() => {
    if (!isOpen || zoom <= 1) return;
    function handleMouseDown(e: MouseEvent) {
      if (e.button !== 0) return;
      setIsPanning(true);
      panStartRef.current = { x: e.clientX, y: e.clientY, panX, panY };
    }
    function handleMouseMove(e: MouseEvent) {
      if (!isPanning) return;
      setPanX(panStartRef.current.panX + (e.clientX - panStartRef.current.x));
      setPanY(panStartRef.current.panY + (e.clientY - panStartRef.current.y));
    }
    function handleMouseUp() { setIsPanning(false); }
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

  const handleSubmitComment = async (e: Event) => {
    e.preventDefault();
    if (!nickname.trim() || !content.trim()) { setSubmitMsg('請填寫暱稱和留言。'); return; }
    setSubmitStatus('submitting');
    setSubmitMsg('');
    try {
      const res = await fetch('/api/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollId, photoKey: currentPhoto._key, nickname: nickname.trim(), email: email.trim() || undefined, content: content.trim() }),
      });
      if (!res.ok) throw new Error('提交失敗');
      setSubmitStatus('success');
      setSubmitMsg('留言已提交，待審核通過後將會顯示。');
      setNickname(''); setEmail(''); setContent('');
    } catch {
      setSubmitStatus('error');
      setSubmitMsg('發生錯誤，請稍後再試。');
    }
  };

  if (!isOpen || photos.length === 0) return null;

  return (
    <div
      ref={overlayRef}
      class="fixed inset-0 z-[100] flex"
      style={{ backgroundColor: 'rgba(20, 18, 16, 0.95)' }}
    >
      {/* LEFT: Photo area */}
      <div class="flex-1 flex items-center justify-center relative" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
        {/* Counter */}
        <div class="absolute top-5 left-5 text-white/50 text-sm z-10">
          {currentIndex + 1} / {photos.length}
        </div>

        {/* Close */}
        <button onClick={close} class="absolute top-5 right-5 text-white/60 hover:text-white transition-colors text-sm z-10">
          關閉
        </button>

        {/* Toggle comments - middle right */}
        <button
          onClick={(e) => { e.stopPropagation(); setShowComments(!showComments); }}
          class="absolute top-1/2 -translate-y-1/2 right-4 text-sm z-10 px-3 py-6 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white/80 hover:bg-white/25 hover:text-white transition-all writing-mode-vertical"
          style="writing-mode:vertical-rl; letter-spacing:0.15em;"
          title={showComments ? '隱藏留言' : '顯示留言'}
        >
          {showComments ? '留言 ‹' : '留言 ›'}
        </button>

        {/* Prev / Next */}
        {photos.length > 1 && zoom <= 1 && (
          <>
            <button onClick={(e) => { e.stopPropagation(); goTo(currentIndex - 1); }} class="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors p-3 text-3xl">‹</button>
            <button onClick={(e) => { e.stopPropagation(); goTo(currentIndex + 1); }} class="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors p-3 text-3xl">›</button>
          </>
        )}

        {/* Image */}
        <img
          ref={imgRef}
          src={currentPhoto.url}
          alt={currentPhoto.caption || `照片 ${currentIndex + 1}`}
          class="max-h-[85vh] max-w-[65vw] object-contain select-none"
          style={{
            transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
            transformOrigin: 'center center',
            cursor: zoom > 1 ? (isPanning ? 'grabbing' : 'grab') : 'zoom-in',
          }}
          onLoad={handleImageLoad}
          draggable={false}
          onDblClick={() => zoom > 1 ? resetView() : setZoom(2.5)}
        />
      </div>

      {/* RIGHT: Comments panel */}
      {showComments && (
      <div class="w-[340px] flex-shrink-0 bg-canvas flex flex-col overflow-hidden">
        {/* Photo name */}
        <div class="px-5 pt-5 pb-4">
          {currentPhoto.caption ? (
            <h2 class="font-heading text-xl font-semibold text-canvas-dark leading-snug">{currentPhoto.caption}</h2>
          ) : (
            <h2 class="font-heading text-xl font-semibold text-canvas-dark/30 italic">未命名照片</h2>
          )}
          <div class="mt-2 flex items-center gap-3">
            <span class="text-xs text-canvas-dark/40">{currentIndex + 1} / {photos.length}</span>
            <span class="text-xs text-canvas-dark/20">·</span>
            <span class="text-xs text-canvas-dark/40">{comments.length} 則留言</span>
          </div>
          <div class="mt-3 h-px bg-warm-gray"></div>
        </div>

        {/* Comments list */}
        <div class="flex-1 overflow-y-auto px-5 py-3 space-y-3">
          {commentLoading && <p class="text-canvas-dark/30 text-sm text-center py-8">載入中...</p>}
          {!commentLoading && comments.length === 0 && (
            <div class="text-center py-10">
              <p class="text-canvas-dark/25 text-sm">還沒有留言</p>
              <p class="text-canvas-dark/15 text-xs mt-1">成為第一個留下足跡的人吧</p>
            </div>
          )}
          {comments.map((c) => (
            <div key={c._id} class="py-2.5 border-b border-warm-gray/50 last:border-0">
              <div class="flex items-baseline gap-2 mb-1">
                <span class="font-medium text-sm text-canvas-dark">{c.nickname}</span>
                <span class="text-xs text-canvas-dark/35">
                  {new Date(c.createdAt).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })}
                </span>
              </div>
              <p class="text-sm text-canvas-dark/70 leading-relaxed">{c.content}</p>
            </div>
          ))}
        </div>

        {/* Comment form */}
        <div class="px-5 py-4 border-t border-warm-gray bg-warm-gray/30">
          {submitStatus === 'success' ? (
            <div class="text-center py-3">
              <p class="text-sm text-canvas-dark/50">{submitMsg}</p>
              <button onClick={() => setSubmitStatus('idle')} class="text-brass text-xs mt-2 hover:underline">再留一則</button>
            </div>
          ) : (
            <form onSubmit={handleSubmitComment} class="space-y-2.5">
              <div class="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={nickname}
                  onInput={(e) => setNickname((e.target as HTMLInputElement).value)}
                  placeholder="暱稱 *"
                  maxLength={50}
                  required
                  class="rounded-card border border-warm-gray bg-white px-3 py-2 text-xs text-canvas-dark placeholder:text-canvas-dark/30 focus:outline-none focus:border-brass"
                />
                <input
                  type="email"
                  value={email}
                  onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
                  placeholder="郵箱（選填）"
                  class="rounded-card border border-warm-gray bg-white px-3 py-2 text-xs text-canvas-dark placeholder:text-canvas-dark/30 focus:outline-none focus:border-brass"
                />
              </div>
              <textarea
                value={content}
                onInput={(e) => setContent((e.target as HTMLTextAreaElement).value)}
                placeholder="分享你的感受..."
                maxLength={1000}
                required
                rows={3}
                class="w-full rounded-card border border-warm-gray bg-white px-3 py-2 text-xs text-canvas-dark placeholder:text-canvas-dark/30 focus:outline-none focus:border-brass resize-none"
              />
              {submitMsg && submitStatus === 'error' && <p class="text-red-500 text-xs">{submitMsg}</p>}
              <button
                type="submit"
                disabled={submitStatus === 'submitting'}
                class="w-full rounded-card bg-canvas-dark text-canvas px-4 py-2.5 text-xs font-medium hover:bg-canvas-dark/80 disabled:opacity-50 transition-all cursor-pointer"
              >
                {submitStatus === 'submitting' ? '發送中...' : '送出留言'}
              </button>
            </form>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
