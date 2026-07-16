import type { APIRoute } from 'astro';
import { sanityWriteClient } from '../../lib/sanity';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { rollId, nickname, email, content } = body;

    // Server-side validation
    if (!rollId || !nickname?.trim() || !content?.trim()) {
      return new Response(JSON.stringify({ error: 'Missing required fields.' }), {
        status: 400,
      });
    }
    if (nickname.length > 50 || content.length > 1000) {
      return new Response(JSON.stringify({ error: 'Field too long.' }), {
        status: 400,
      });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email.' }), {
        status: 400,
      });
    }

    await sanityWriteClient.create({
      _type: 'comment',
      roll: { _type: 'reference', _ref: rollId },
      nickname: nickname.trim(),
      email: email?.trim() || '',
      content: content.trim(),
      isApproved: false,
      createdAt: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ success: true }), { status: 201 });
  } catch (error) {
    console.error('Comment submission error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error.' }), {
      status: 500,
    });
  }
};
