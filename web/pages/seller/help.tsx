import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import SellerLayout from '../../components/seller/SellerLayout';
import { formatDate, getApiUrl } from '../../lib/api/utils';
import { useAuth, tokenManager } from '../../lib/auth';
import { 
  HelpCircle, 
  MessageSquare, 
  FileText, 
  Mail, 
  Phone,
  Send,
  CheckCircle,
  Clock,
  AlertCircle,
  Book,
  Video,
  ExternalLink
} from 'lucide-react';

import type { SupportTicket } from '../../types/support';

export default function HelpPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'faq' | 'contact' | 'tickets'>('faq');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Contact form state
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
    category: 'general',
    priority: 'MEDIUM' as const,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;

    // Check authentication
    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }

    if (user.role && user.role !== 'SELLER' && user.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    // Fetch support tickets
    fetchTickets();
  }, [router, authLoading, isAuthenticated, user]);

  const fetchTickets = async () => {
    setLoadingTickets(true);
    try {
      const token = tokenManager.getAccessToken();
      const response = await fetch(getApiUrl('/support/tickets'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        const ticketsData = result.data || result;
        setTickets(Array.isArray(ticketsData) ? ticketsData : []);
      }
    } catch (error) {
      console.error('Error fetching support tickets:', error);
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleContactFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setContactForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contactForm.subject || !contactForm.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const token = tokenManager.getAccessToken();
      const response = await fetch(getApiUrl('/support/tickets'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(contactForm),
      });

      if (response.ok) {
        toast.success('Support ticket submitted successfully!');
        setContactForm({
          subject: '',
          message: '',
          category: 'general',
          priority: 'MEDIUM',
        });
        // Switch to tickets tab and refresh
        setActiveTab('tickets');
        fetchTickets();
      } else {
        const error = await response.json();
        toast.error(`Failed to submit ticket: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error submitting ticket:', error);
      toast.error('Failed to submit ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Clock className="w-5 h-5 text-yellow-400" />;
      case 'IN_PROGRESS':
        return <AlertCircle className="w-5 h-5 text-blue-400" />;
      case 'RESOLVED':
      case 'CLOSED':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      default:
        return <HelpCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'IN_PROGRESS':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'RESOLVED':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'CLOSED':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
      default:
        return 'bg-[#1a1a1a] text-white border-[#ff6600]/30';
    }
  };

  const faqs = [
    {
      category: 'Getting Started',
      questions: [
        {
          q: 'How do I add a new product?',
          a: 'Navigate to the Products page and click the "Add Product" button. Fill in the product details, upload images, and submit. Your product will be reviewed before going live.',
        },
        {
          q: 'How long does KYC approval take?',
          a: 'KYC approval typically takes 1-3 business days. You can check your status in the Settings > Business section.',
        },
        {
          q: 'Can I edit products after approval?',
          a: 'Yes! Go to Products, find your product, and click "Edit". Changes will be saved immediately.',
        },
      ],
    },
    {
      category: 'Orders & Fulfillment',
      questions: [
        {
          q: 'How do I fulfill an order?',
          a: 'Once you receive an order notification, prepare the product and update the order status. Our logistics partner will handle pickup and delivery.',
        },
        {
          q: 'What if I cannot fulfill an order?',
          a: 'Contact support immediately. Do not attempt to cancel orders yourself as this affects your seller rating.',
        },
      ],
    },
    {
      category: 'Payments & Payouts',
      questions: [
        {
          q: 'When do I receive my earnings?',
          a: 'Earnings are available for withdrawal 7 days after order delivery. Request payouts from the Earnings page.',
        },
        {
          q: 'What is the commission rate?',
          a: 'The platform commission is deducted from each sale. View detailed breakdowns in the Earnings section.',
        },
        {
          q: 'How do I add my bank account?',
          a: 'Go to Settings > Payout Account and link your Nigerian bank account. This is required before requesting payouts.',
        },
      ],
    },
    {
      category: 'Technical Support',
      questions: [
        {
          q: 'I cannot upload product images',
          a: 'Ensure your images are under 5MB and in JPG, PNG, or WebP format. Clear your browser cache and try again. If the issue persists, contact support.',
        },
        {
          q: 'My dashboard shows no data',
          a: 'This is normal for new sellers. Once you add products and receive orders, your dashboard will populate with real-time data.',
        },
      ],
    },
  ];

  // Show loading state while auth is initializing
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

  // Don't render until auth check is complete
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Help & Support - Seller Portal | Carryofy</title>
        <meta
          name="description"
          content="Get help and support for your seller account on Carryofy."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <SellerLayout>
        <div>
          {/* Title Section */}
          <div className="flex flex-wrap justify-between gap-3 p-4">
            <div>
              <p className="text-white tracking-light text-[32px] font-bold leading-tight min-w-72">
                Help & Support
              </p>
              <p className="text-[#ffcc99] text-sm font-normal leading-normal mt-1">
                Get answers to your questions or contact our support team
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-4 py-3">
            <div className="flex gap-2 border-b border-[#ff6600]/30">
              {[
                { id: 'faq', label: 'FAQs', icon: Book },
                { id: 'contact', label: 'Contact Support', icon: MessageSquare },
                { id: 'tickets', label: 'My Tickets', icon: FileText },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-[#ff6600] border-b-2 border-[#ff6600]'
                      : 'text-[#ffcc99] hover:text-white'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 py-3">
            {/* FAQ Tab */}
            {activeTab === 'faq' && (
              <div className="space-y-6">
                {/* Quick Links */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <a
                    href="https://docs.carryofy.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6 hover:border-[#ff6600] transition group"
                  >
                    <Book className="w-8 h-8 text-[#ff6600] mb-3" />
                    <h3 className="text-white font-bold mb-2">Documentation</h3>
                    <p className="text-[#ffcc99] text-sm mb-3">
                      Complete guides and tutorials
                    </p>
                    <div className="flex items-center gap-2 text-[#ff6600] text-sm group-hover:gap-3 transition-all">
                      <span>Learn more</span>
                      <ExternalLink className="w-4 h-4" />
                    </div>
                  </a>

                  <a
                    href="https://www.youtube.com/@carryofy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6 hover:border-[#ff6600] transition group"
                  >
                    <Video className="w-8 h-8 text-[#ff6600] mb-3" />
                    <h3 className="text-white font-bold mb-2">Video Tutorials</h3>
                    <p className="text-[#ffcc99] text-sm mb-3">
                      Watch step-by-step guides
                    </p>
                    <div className="flex items-center gap-2 text-[#ff6600] text-sm group-hover:gap-3 transition-all">
                      <span>Watch now</span>
                      <ExternalLink className="w-4 h-4" />
                    </div>
                  </a>

                  <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
                    <Mail className="w-8 h-8 text-[#ff6600] mb-3" />
                    <h3 className="text-white font-bold mb-2">Email Support</h3>
                    <p className="text-[#ffcc99] text-sm mb-1">support@carryofy.com</p>
                    <p className="text-[#ffcc99] text-xs">Response within 24 hours</p>
                  </div>
                </div>

                {/* FAQs */}
                <div className="space-y-4">
                  {faqs.map((section, sectionIndex) => (
                    <div key={sectionIndex} className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
                      <h2 className="text-white text-xl font-bold mb-4">{section.category}</h2>
                      <div className="space-y-4">
                        {section.questions.map((faq, faqIndex) => (
                          <div key={faqIndex} className="pb-4 border-b border-[#ff6600]/20 last:border-b-0 last:pb-0">
                            <h3 className="text-white font-semibold mb-2">{faq.q}</h3>
                            <p className="text-[#ffcc99] text-sm leading-relaxed">{faq.a}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Support Tab */}
            {activeTab === 'contact' && (
              <div className="max-w-2xl">
                <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
                  <h2 className="text-white text-xl font-bold mb-6">Submit a Support Ticket</h2>
                  
                  <form onSubmit={handleSubmitTicket} className="space-y-6">
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Category *
                      </label>
                      <select
                        name="category"
                        value={contactForm.category}
                        onChange={handleContactFormChange}
                        required
                        className="form-input flex w-full resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-0 border border-[#ff6600]/30 bg-black focus:border-[#ff6600] h-14 p-4 text-base font-normal leading-normal"
                      >
                        <option value="general">General Inquiry</option>
                        <option value="products">Product Issues</option>
                        <option value="orders">Order Management</option>
                        <option value="payments">Payments & Payouts</option>
                        <option value="account">Account Settings</option>
                        <option value="technical">Technical Support</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Priority
                      </label>
                      <select
                        name="priority"
                        value={contactForm.priority}
                        onChange={handleContactFormChange}
                        className="form-input flex w-full resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-0 border border-[#ff6600]/30 bg-black focus:border-[#ff6600] h-14 p-4 text-base font-normal leading-normal"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Subject *
                      </label>
                      <input
                        type="text"
                        name="subject"
                        value={contactForm.subject}
                        onChange={handleContactFormChange}
                        placeholder="Brief description of your issue"
                        required
                        className="form-input flex w-full resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-0 border border-[#ff6600]/30 bg-black focus:border-[#ff6600] h-14 placeholder:text-[#ffcc99] p-4 text-base font-normal leading-normal"
                      />
                    </div>

                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Message *
                      </label>
                      <textarea
                        name="message"
                        value={contactForm.message}
                        onChange={handleContactFormChange}
                        placeholder="Provide detailed information about your issue"
                        required
                        rows={6}
                        className="form-input flex w-full resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-0 border border-[#ff6600]/30 bg-black focus:border-[#ff6600] placeholder:text-[#ffcc99] p-4 text-base font-normal leading-normal"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-[#ff6600] hover:bg-[#cc5200] disabled:bg-[#ff6600]/50 disabled:cursor-not-allowed text-black px-6 py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2"
                    >
                      <Send className="w-5 h-5" />
                      {submitting ? 'Submitting...' : 'Submit Ticket'}
                    </button>
                  </form>

                  <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                    <p className="text-[#ffcc99] text-sm">
                      <strong className="text-white">Note:</strong> Our support team typically responds within 24 hours. 
                      For urgent issues, please mark your ticket as "Urgent" or call our hotline.
                    </p>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
                    <Mail className="w-6 h-6 text-[#ff6600] mb-3" />
                    <h3 className="text-white font-bold mb-2">Email Us</h3>
                    <a href="mailto:support@carryofy.com" className="text-[#ffcc99] hover:text-[#ff6600] transition">
                      support@carryofy.com
                    </a>
                  </div>

                  <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
                    <Phone className="w-6 h-6 text-[#ff6600] mb-3" />
                    <h3 className="text-white font-bold mb-2">Call Us</h3>
                    <p className="text-[#ffcc99]">+234 916 678 3040</p>
                    <p className="text-[#ffcc99] text-xs mt-1">Mon-Fri, 9am-6pm WAT</p>
                  </div>
                </div>
              </div>
            )}

            {/* My Tickets Tab */}
            {activeTab === 'tickets' && (
              <div className="space-y-4">
                {loadingTickets ? (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 border-4 border-[#ff6600]/30 border-t-[#ff6600] rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-[#ffcc99]">Loading tickets...</p>
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-12 text-center">
                    <MessageSquare className="w-16 h-16 text-[#ffcc99] mx-auto mb-4 opacity-50" />
                    <h3 className="text-white text-xl font-bold mb-2">No support tickets yet</h3>
                    <p className="text-[#ffcc99] mb-6">
                      You haven't submitted any support requests
                    </p>
                    <button
                      onClick={() => setActiveTab('contact')}
                      className="bg-[#ff6600] hover:bg-[#cc5200] text-black px-6 py-3 rounded-xl font-semibold transition"
                    >
                      Create Your First Ticket
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6 hover:border-[#ff6600]/50 transition"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              {getStatusIcon(ticket.status)}
                              <h3 className="text-white font-bold text-lg">{ticket.subject}</h3>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                              <span className={`px-3 py-1 rounded-full border ${getStatusColor(ticket.status)}`}>
                                {ticket.status.replace('_', ' ')}
                              </span>
                              <span className="text-[#ffcc99]">
                                {ticket.category.charAt(0).toUpperCase() + ticket.category.slice(1)}
                              </span>
                              <span className="text-[#ffcc99]">
                                {formatDate(ticket.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <p className="text-[#ffcc99] text-sm mb-4 line-clamp-2">
                          {ticket.message}
                        </p>

                        {ticket.adminNotes && (
                          <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                            <p className="text-white font-semibold text-sm mb-2">Admin Response:</p>
                            <p className="text-[#ffcc99] text-sm">{ticket.adminNotes}</p>
                          </div>
                        )}

                        {ticket.resolvedAt && (
                          <div className="mt-4 flex items-center gap-2 text-green-400 text-sm">
                            <CheckCircle className="w-4 h-4" />
                            <span>Resolved on {formatDate(ticket.resolvedAt)}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </SellerLayout>
    </>
  );
}

