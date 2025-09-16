import type { NextApiRequest, NextApiResponse } from 'next';

// --- Mock async data store for feedback ---
const FEEDBACK_STORE: { [recipeId: string]: string[] } = {};

// --- Mock async analytics function ---
async function logAnalytics({ recipeId, feedback }: { recipeId: string; feedback: string }): Promise<void> {
  return new Promise((resolve, reject) => {
    // Simulate possible logging delay and random failure
    setTimeout(() => {
      if (Math.random() < 0.97) {
        console.log(`[Analytics] Feedback submitted for recipe ${recipeId}`);
        resolve();
      } else {
        reject(new Error('Analytics logging failed'));
      }
    }, 500);
  });
}

// --- Mock async feedback persistence ---
async function storeFeedback({ recipeId, feedback }: { recipeId: string; feedback: string }): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (!FEEDBACK_STORE[recipeId]) FEEDBACK_STORE[recipeId] = [];
      FEEDBACK_STORE[recipeId].push(feedback);
      resolve();
    }, 250); // Simulate DB latency
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }
  const { recipeId, feedback } = req.body || {};
  if (!recipeId || typeof recipeId !== 'string' || !feedback || typeof feedback !== 'string') {
    res.status(400).json({ error: 'Invalid input' });
    return;
  }
  try {
    // Await feedback store write (let error propagate)
    await storeFeedback({ recipeId, feedback });
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save feedback' });
    return;
  }
  // Trigger analytics logging asynchronously, error is ignored for user
  logAnalytics({ recipeId, feedback })
    .then(() => {})
    .catch(err => {
      // Could log the error to server logs
      console.warn('[Analytics error]', err);
    });
}
