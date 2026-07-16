import { useState, useEffect } from 'preact/hooks';
import CommentForm from './CommentForm.tsx';

interface CommentData {
  _id: string;
  nickname: string;
  content: string;
  createdAt: string;
}

interface Props {
  rollId: string;
}

export default function CommentSection({ rollId }: Props) {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/comment?rollId=${rollId}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchComments(); }, [rollId]);

  const handleCommentSubmitted = () => {
    fetchComments();
  };

  return (
    <section class="mt-16 border-t border-warm-gray pt-12">
      <h2 class="text-2xl font-heading font-semibold mb-8">
        留言 ({comments.length})
      </h2>

      <div class="space-y-6 mb-12">
        {comments.map((comment) => (
          <div class="bg-white rounded-card p-5 shadow-sm border border-warm-gray/30" key={comment._id}>
            <div class="flex items-baseline gap-2 mb-2">
              <span class="font-medium text-sm text-canvas-dark">{comment.nickname}</span>
              <span class="text-xs text-canvas-dark/40">
                {new Date(comment.createdAt).toLocaleDateString('zh-TW', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            <p class="text-sm text-canvas-dark/75 leading-relaxed">{comment.content}</p>
          </div>
        ))}
        {!loading && comments.length === 0 && (
          <p class="text-canvas-dark/40 italic text-sm">暫無留言，成為第一個留下足跡的人吧。</p>
        )}
      </div>

      <CommentForm rollId={rollId} onSubmitted={handleCommentSubmitted} />
    </section>
  );
}
