import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { askProductQuestion } from '../../lib/api/ai-product-ask';

interface ProductAskAIProps {
  productId: string;
}

export default function ProductAskAI({ productId }: ProductAskAIProps) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAsk = async () => {
    const q = question.trim();
    if (!q || loading) return;
    setLoading(true);
    setError(null);
    setAnswer(null);
    try {
      const text = await askProductQuestion(productId, q);
      setAnswer(text || 'No answer available.');
    } catch {
      setError('Could not get an answer. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
      <p className="text-sm font-medium text-[#ffcc99] flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-[#FF6B00]" />
        Ask about this product
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
          placeholder="e.g. Is this good for a restaurant?"
          className="flex-1 px-3 py-2 rounded-lg bg-black/40 border border-white/20 text-white text-sm placeholder:text-[#ffcc99]/40"
        />
        <button
          type="button"
          onClick={handleAsk}
          disabled={loading || !question.trim()}
          className="px-4 py-2 rounded-lg bg-[#FF6B00]/20 text-[#FF6B00] text-sm font-medium hover:bg-[#FF6B00]/30 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ask'}
        </button>
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}
      {answer && <p className="text-sm text-white/90 leading-relaxed">{answer}</p>}
    </div>
  );
}
