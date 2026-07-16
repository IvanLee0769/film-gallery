import { useState } from 'preact/hooks';

interface CommentFormProps {
  rollId: string;
  onSubmitted?: () => void;
}

export default function CommentForm({ rollId, onSubmitted }: CommentFormProps) {
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    if (!nickname.trim()) {
      setErrorMsg('請輸入你的暱稱。');
      return;
    }
    if (!content.trim()) {
      setErrorMsg('請輸入留言內容。');
      return;
    }
    if (nickname.length > 50) {
      setErrorMsg('暱稱不能超過 50 個字。');
      return;
    }
    if (content.length > 1000) {
      setErrorMsg('留言不能超過 1000 個字。');
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg('請輸入有效的電子郵件地址。');
      return;
    }

    setStatus('submitting');
    setErrorMsg('');

    try {
      const res = await fetch('/api/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rollId,
          nickname: nickname.trim(),
          email: email.trim() || undefined,
          content: content.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '發生錯誤');
      }

      setStatus('success');
      setNickname('');
      setEmail('');
      setContent('');
      onSubmitted?.();
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : '發生錯誤，請稍後再試。');
    }
  };

  if (status === 'success') {
    return (
      <div class="bg-warm-gray/30 border border-warm-gray rounded-card p-6 text-center">
        <p class="text-canvas-dark font-medium">感謝你的留言！</p>
        <p class="text-canvas-dark/60 text-sm mt-1">你的留言已發布。</p>
        <button
          onClick={() => setStatus('idle')}
          class="mt-3 text-brass text-sm hover:underline"
        >
          再留一則
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} class="space-y-4">
      <h3 class="font-heading text-xl font-semibold">留下足跡</h3>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="nickname" class="block text-sm text-canvas-dark/70 mb-1">
            暱稱 <span class="text-brass">*</span>
          </label>
          <input
            id="nickname"
            type="text"
            value={nickname}
            onInput={(e) => setNickname((e.target as HTMLInputElement).value)}
            maxLength={50}
            required
            placeholder="你的暱稱"
            class="w-full rounded-card border border-warm-gray bg-white px-4 py-2.5 text-sm text-canvas-dark placeholder:text-canvas-dark/30 focus:outline-none focus:border-brass transition-colors"
          />
        </div>

        <div>
          <label htmlFor="email" class="block text-sm text-canvas-dark/70 mb-1">
            電子郵件 <span class="text-canvas-dark/40">（選填）</span>
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
            placeholder="you@example.com"
            class="w-full rounded-card border border-warm-gray bg-white px-4 py-2.5 text-sm text-canvas-dark placeholder:text-canvas-dark/30 focus:outline-none focus:border-brass transition-colors"
          />
        </div>
      </div>

      <div>
        <label htmlFor="content" class="block text-sm text-canvas-dark/70 mb-1">
          留言內容 <span class="text-brass">*</span>
        </label>
        <textarea
          id="content"
          value={content}
          onInput={(e) => setContent((e.target as HTMLTextAreaElement).value)}
          maxLength={1000}
          required
          rows={4}
          placeholder="分享你的感受..."
          class="w-full rounded-card border border-warm-gray bg-white px-4 py-2.5 text-sm text-canvas-dark placeholder:text-canvas-dark/30 focus:outline-none focus:border-brass transition-colors resize-y"
        />
      </div>

      {errorMsg && (
        <p class="text-red-500 text-sm">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        class="rounded-card bg-canvas-dark text-canvas px-6 py-2.5 text-sm font-medium hover:bg-canvas-dark/80 disabled:opacity-50 transition-all cursor-pointer"
      >
        {status === 'submitting' ? '發送中...' : '送出留言'}
      </button>
    </form>
  );
}
