import { useState } from 'preact/hooks';

interface CommentFormProps {
  rollId: string;
}

export default function CommentForm({ rollId }: CommentFormProps) {
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    // Client-side validation
    if (!nickname.trim()) {
      setErrorMsg('Please enter your nickname.');
      return;
    }
    if (!content.trim()) {
      setErrorMsg('Please enter a comment.');
      return;
    }
    if (nickname.length > 50) {
      setErrorMsg('Nickname must be under 50 characters.');
      return;
    }
    if (content.length > 1000) {
      setErrorMsg('Comment must be under 1000 characters.');
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg('Please enter a valid email address.');
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
        throw new Error(data.error || 'Something went wrong');
      }

      setStatus('success');
      setNickname('');
      setEmail('');
      setContent('');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <div class="bg-warm-gray/30 border border-warm-gray rounded-card p-6 text-center">
        <p class="text-canvas-dark font-medium">Thank you!</p>
        <p class="text-canvas-dark/60 text-sm mt-1">Your comment has been submitted for review.</p>
        <button
          onClick={() => setStatus('idle')}
          class="mt-3 text-brass text-sm hover:underline"
        >
          Leave another comment
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} class="space-y-4">
      <h3 class="font-heading text-xl font-semibold">Leave a Comment</h3>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="nickname" class="block text-sm text-canvas-dark/70 mb-1">
            Name <span class="text-brass">*</span>
          </label>
          <input
            id="nickname"
            type="text"
            value={nickname}
            onInput={(e) => setNickname((e.target as HTMLInputElement).value)}
            maxLength={50}
            required
            placeholder="Your name"
            class="w-full rounded-card border border-warm-gray bg-white px-4 py-2.5 text-sm text-canvas-dark placeholder:text-canvas-dark/30 focus:outline-none focus:border-brass transition-colors"
          />
        </div>

        <div>
          <label htmlFor="email" class="block text-sm text-canvas-dark/70 mb-1">
            Email <span class="text-canvas-dark/40">(optional)</span>
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
          Comment <span class="text-brass">*</span>
        </label>
        <textarea
          id="content"
          value={content}
          onInput={(e) => setContent((e.target as HTMLTextAreaElement).value)}
          maxLength={1000}
          required
          rows={4}
          placeholder="Share your thoughts..."
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
        {status === 'submitting' ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}
