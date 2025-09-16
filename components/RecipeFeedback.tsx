import React, { useState } from 'react';

interface RecipeFeedbackProps {
  recipeId: string;
  onFeedbackSubmitted?: (feedback: string) => void;
}

interface FeedbackEntry {
  id: string;
  feedback: string;
  status: 'pending' | 'success' | 'error';
}

// Helper to generate a temporary unique ID
default function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const RecipeFeedback: React.FC<RecipeFeedbackProps> = ({ recipeId }) => {
  const [feedback, setFeedback] = useState('');
  const [submissions, setSubmissions] = useState<FeedbackEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  // On form submit, do an optimistic UI update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const feedbackValue = feedback.trim();
    if (!feedbackValue) return;
    const tempId = uuidv4();

    // Optimistically update
    setSubmissions(prev => [
      {
        id: tempId,
        feedback: feedbackValue,
        status: 'pending',
      },
      ...prev
    ]);
    setFeedback('');

    // Send feedback to the API
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipeId, feedback: feedbackValue })
      });
      if (!res.ok) throw new Error('Network error');

      setSubmissions(prev => prev.map(entry =>
        entry.id === tempId ? { ...entry, status: 'success' } : entry
      ));
    } catch (err) {
      setSubmissions(prev => prev.map(entry =>
        entry.id === tempId ? { ...entry, status: 'error' } : entry
      ));
      // Show error
      setError('Failed to submit feedback. Please try again.');
      // Optionally: Remove the entry after some delay
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} style={{ marginBottom: 16 }}>
        <textarea
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          placeholder="Leave your feedback..."
          rows={3}
          style={{ width: '100%', resize: 'vertical' }}
        />
        <button type="submit" disabled={!feedback.trim()}>Submit Feedback</button>
      </form>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <ul>
        {submissions.map(entry => (
          <li key={entry.id}>
            <span>{entry.feedback}</span> {' '}
            {entry.status === 'pending' && <em style={{ color: 'gray' }}>(Saving...)</em>}
            {entry.status === 'success' && <em style={{ color: 'green' }}>(Saved)</em>}
            {entry.status === 'error' && <em style={{ color: 'red' }}>(Error!)</em>}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecipeFeedback;
