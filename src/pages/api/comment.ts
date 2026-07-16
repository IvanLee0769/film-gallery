import type { APIRoute } from 'astro';
import { sanityClient, sanityWriteClient } from '../../lib/sanity';
import { commentsByRollQuery } from '../../lib/queries';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const rollId = url.searchParams.get('rollId');
  if (!rollId) {
    return new Response(JSON.stringify({ error: '缺少 rollId' }), { status: 400 });
  }
  const comments = await sanityClient.fetch(commentsByRollQuery, { rollId });
  return new Response(JSON.stringify(comments), { status: 200 });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { rollId, nickname, email, content } = body;

    if (!rollId || !nickname?.trim() || !content?.trim()) {
      return new Response(JSON.stringify({ error: '缺少必填欄位。' }), {
        status: 400,
      });
    }
    if (nickname.length > 50 || content.length > 1000) {
      return new Response(JSON.stringify({ error: '欄位超出字數限制。' }), {
        status: 400,
      });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: '電子郵件格式無效。' }), {
        status: 400,
      });
    }

    await sanityWriteClient.create({
      _type: 'comment',
      roll: { _type: 'reference', _ref: rollId },
      nickname: nickname.trim(),
      email: email?.trim() || '',
      content: content.trim(),
      isApproved: true,
      createdAt: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ success: true }), { status: 201 });
  } catch (error) {
    console.error('Comment submission error:', error);
    return new Response(JSON.stringify({ error: '伺服器內部錯誤。' }), {
      status: 500,
    });
  }
};
