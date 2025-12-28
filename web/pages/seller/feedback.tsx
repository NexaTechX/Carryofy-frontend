import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import SellerLayout from '../../components/seller/SellerLayout';
import { useAuth, tokenManager } from '../../lib/auth';
import { MessageSquare, Send, Star, ThumbsUp, Heart } from 'lucide-react';
import { apiClient } from '../../lib/api/client';

export default function SellerFeedbackPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  
  const [feedbackForm, setFeedbackForm] = useState({
    category: 'general',
    feedback: '',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }

    if (user.role && user.role !== 'SELLER' && user.role !== 'ADMIN') {
      router.push('/');
      return;
    }
  }, [router, authLoading, isAuthenticated, user]);

  const handleFormChange = (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFeedbackForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!feedbackForm.feedback || rating === 0) {
      setMessage({ type: 'error', text: 'Please provide a rating and feedback' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post('/feedback', {
        rating,
        category: feedbackForm.category,
        feedback: feedbackForm.feedback,
      });
      
      setMessage({ type: 'success', text: 'Thank you for your feedback! We appreciate your input.' });
      setFeedbackForm({
        category: 'general',
        feedback: '',
      });
      setRating(0);
      setTimeout(() => setMessage(null), 5000);
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to submit feedback. Please try again.';
      setMessage({ 
        type: 'error', 
        text: errorMessage
      });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#ff6600]/30 border-t-[#ff6600] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#ffcc99]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!mounted || !isAuthenticated || !user) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Feedback - Seller Portal | Carryofy</title>
        <meta name="description" content="Share your feedback to help us improve Carryofy" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <SellerLayout>
        <div>
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-white text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-[#ff6600]" />
              Feedback
            </h1>
            <p className="text-[#ffcc99] text-lg">
              Help us improve! Share your thoughts and suggestions about your seller experience.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            {/* Feedback Form */}
            <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-8">
              <div className="text-center mb-8">
                <Heart className="w-16 h-16 text-[#ff6600] mx-auto mb-4" />
                <h2 className="text-white text-2xl font-bold mb-2">We Value Your Opinion</h2>
                <p className="text-[#ffcc99]">
                  Your feedback helps us create a better selling experience for all merchants.
                </p>
              </div>

              {message && (
                <div className={`mb-6 p-4 rounded-xl ${
                  message.type === 'success'
                    ? 'bg-green-500/10 border border-green-500/50 text-green-400'
                    : 'bg-red-500/10 border border-red-500/50 text-red-400'
                }`}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handleSubmitFeedback} className="space-y-6">
                {/* Rating */}
                <div>
                  <label className="block text-white text-sm font-medium mb-3 text-center">
                    How would you rate your overall experience? *
                  </label>
                  <div className="flex items-center justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        className="transition transform hover:scale-110"
                      >
                        <Star
                          className={`w-12 h-12 ${
                            star <= (hoveredRating || rating)
                              ? 'text-[#ff6600] fill-[#ff6600]'
                              : 'text-[#ffcc99]/30'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  {rating > 0 && (
                    <p className="text-center text-[#ffcc99] text-sm mt-2">
                      {rating === 1 && 'Poor'}
                      {rating === 2 && 'Fair'}
                      {rating === 3 && 'Good'}
                      {rating === 4 && 'Very Good'}
                      {rating === 5 && 'Excellent'}
                    </p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Feedback Category
                  </label>
                  <select
                    name="category"
                    value={feedbackForm.category}
                    onChange={handleFormChange}
                    className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#ff6600]/30 rounded-xl text-white focus:outline-none focus:border-[#ff6600]"
                  >
                    <option value="general">General Experience</option>
                    <option value="products">Product Management</option>
                    <option value="website">Seller Portal Usability</option>
                    <option value="delivery">Delivery & Logistics</option>
                    <option value="customer-service">Customer Service</option>
                    <option value="pricing">Pricing & Commissions</option>
                    <option value="suggestion">Feature Suggestion</option>
                  </select>
                </div>

                {/* Feedback Text */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Your Feedback *
                  </label>
                  <textarea
                    name="feedback"
                    value={feedbackForm.feedback}
                    onChange={handleFormChange}
                    placeholder="Tell us what you think! What did you like? What can we improve?"
                    rows={8}
                    className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#ff6600]/30 rounded-xl text-white placeholder-[#ffcc99]/50 focus:outline-none focus:border-[#ff6600] resize-none"
                    required
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting || rating === 0}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#ff6600] text-black rounded-xl font-bold hover:bg-[#cc5200] disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-[#ff6600]/30"
                >
                  <Send className="w-5 h-5" />
                  {submitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </form>
            </div>

            {/* Why Your Feedback Matters */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6 text-center">
                <ThumbsUp className="w-8 h-8 text-[#ff6600] mx-auto mb-3" />
                <h3 className="text-white font-bold mb-2">Improve Platform</h3>
                <p className="text-[#ffcc99] text-sm">
                  Help us offer better tools and features for sellers
                </p>
              </div>
              <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6 text-center">
                <Star className="w-8 h-8 text-[#ff6600] mx-auto mb-3" />
                <h3 className="text-white font-bold mb-2">Enhance Experience</h3>
                <p className="text-[#ffcc99] text-sm">
                  Shape a better selling experience for all merchants
                </p>
              </div>
              <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6 text-center">
                <MessageSquare className="w-8 h-8 text-[#ff6600] mx-auto mb-3" />
                <h3 className="text-white font-bold mb-2">Be Heard</h3>
                <p className="text-[#ffcc99] text-sm">
                  Your voice matters and helps drive our improvements
                </p>
              </div>
            </div>
          </div>
        </div>
      </SellerLayout>
    </>
  );
}

