import Head from 'next/head';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import BuyerLayout from '../../components/buyer/BuyerLayout';
import { tokenManager, userManager } from '../../lib/auth';
import apiClient from '../../lib/api/client';
import {
  HelpCircle,
  MessageSquare,
  Mail,
  Send,
  CheckCircle,
  Clock,
  AlertCircle,
  Book,
  Package,
  ShoppingCart,
  Truck,
  CreditCard,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  ThumbsDown,
  FileText,
} from 'lucide-react';

import type { SupportTicket } from '../../types/support';
import { formatDate } from '../../lib/api/utils';

const FAQ_CATEGORIES = ['All', 'Orders', 'Payments', 'Delivery', 'Returns', 'B2B & Bulk', 'Account'] as const;

const faqsData = [
  { category: 'Orders' as const, icon: ShoppingCart, question: 'How do I place an order?', answer: 'Browse products, add items to your cart, and proceed to checkout. Fill in your delivery details and complete payment to place your order.' },
  { category: 'Orders' as const, icon: Truck, question: 'How can I track my order?', answer: 'Go to "My Orders" from the sidebar menu. Click on any order to view its tracking status and delivery updates.' },
  { category: 'Payments' as const, icon: CreditCard, question: 'What payment methods do you accept?', answer: 'We accept various payment methods including bank transfers, card payments, and digital wallets for your convenience.' },
  { category: 'Returns' as const, icon: RefreshCw, question: 'What is your return policy?', answer: 'We offer a 7-day return policy for most products. Items must be unused and in original packaging. Contact support to initiate a return.' },
  { category: 'Delivery' as const, icon: Package, question: 'How long does delivery take?', answer: 'Delivery typically takes 3-7 business days depending on your location. Express delivery options are available for faster shipping.' },
  { category: 'Account' as const, icon: HelpCircle, question: 'How do I contact a seller?', answer: 'You can view seller information on each product page. For support with orders, contact our customer service team.' },
  { category: 'B2B & Bulk' as const, icon: FileText, question: 'How do I request a bulk order quote?', answer: 'Go to the Bulk Order page from the sidebar. Fill in the product details, quantity, and your requirements. Our team will send you a custom quote within 24 hours.' },
  { category: 'B2B & Bulk' as const, icon: FileText, question: 'What is MOQ and how does tiered pricing work?', answer: 'MOQ (Minimum Order Quantity) is the smallest quantity you can order for bulk purchases. Tiered pricing means the unit price decreases as you order more—higher quantities get better per-unit rates.' },
  { category: 'B2B & Bulk' as const, icon: FileText, question: 'Can I get an invoice for business purchases?', answer: 'Yes. For bulk and B2B orders, we provide formal invoices. You can request an invoice when placing your order or by contacting support@carryofy.com with your order details.' },
  { category: 'Delivery' as const, icon: Truck, question: 'Can I change my delivery address after ordering?', answer: 'If your order has not yet shipped, contact support immediately. Once shipped, address changes may not be possible. Check your order status in My Orders.' },
];

// Placeholder tickets for demo when API returns empty
const placeholderTickets: SupportTicket[] = [
  { id: 'tkt-demo-001', subject: 'Delivery delay - Order #12345', message: 'Order has not arrived after 10 days.', category: 'delivery', priority: 'MEDIUM', status: 'IN_PROGRESS', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'tkt-demo-002', subject: 'Invoice request for bulk order', message: 'Need formal invoice for business records.', category: 'bulk_order', priority: 'LOW', status: 'RESOLVED', adminNotes: 'Invoice sent via email.', createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), updatedAt: new Date().toISOString() },
];

export default function BuyerHelpPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'faq' | 'contact' | 'tickets'>('faq');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // FAQ state
  const [faqCategory, setFaqCategory] = useState<string>('All');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [faqFeedback, setFaqFeedback] = useState<Record<number, 'up' | 'down' | null>>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    subjectOption: 'Order Issue' as string,
  });


  useEffect(() => {
    setMounted(true);
    if (!tokenManager.isAuthenticated()) {
      router.push('/auth/login');
      return;
    }
    const u = userManager.getUser();
    if (!u) {
      router.push('/auth/login');
      return;
    }
    if (u.role && u.role !== 'BUYER' && u.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    setContactForm(prev => ({
      ...prev,
      name: u.name || '',
      email: (u as { email?: string }).email || '',
    }));
    if (activeTab === 'tickets') fetchTickets();
  }, [router, activeTab]);

  const fetchTickets = async () => {
    setLoadingTickets(true);
    try {
      const response = await apiClient.get('/support/tickets');
      const ticketsData = response.data?.data ?? response.data;
      setTickets(Array.isArray(ticketsData) ? ticketsData : []);
    } catch {
      setTickets(placeholderTickets);
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleContactFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setContactForm(prev => ({ ...prev, [name]: value }));
  };

  const categoryMap: Record<string, string> = {
    'Order Issue': 'orders',
    'Payment': 'payments',
    'Delivery': 'delivery',
    'Bulk Order': 'bulk_order',
    'Account': 'account',
    'Other': 'other',
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.message?.trim()) {
      setMessage({ type: 'error', text: 'Please enter your message' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post('/support/tickets', {
        subject: contactForm.subjectOption,
        message: contactForm.message,
        category: categoryMap[contactForm.subjectOption] || 'other',
        priority: 'MEDIUM' as const,
      });
      setMessage({ type: 'success', text: 'Support ticket submitted successfully!' });
      setContactForm(prev => ({ ...prev, subject: '', message: '' }));
      setTimeout(() => {
        setActiveTab('tickets');
        fetchTickets();
        setMessage(null);
      }, 2000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setMessage({ type: 'error', text: msg || 'Failed to submit ticket. Please try again.' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredFaqs = useMemo(() => {
    let list = faqsData.filter(
      f =>
        (faqCategory === 'All' || f.category === faqCategory) &&
        (!searchQuery.trim() ||
          f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.answer.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    return list;
  }, [faqCategory, searchQuery]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      OPEN: 'bg-amber-500/15 text-amber-400 border-amber-500/40',
      IN_PROGRESS: 'bg-blue-500/15 text-blue-400 border-blue-500/40',
      RESOLVED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
      CLOSED: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/40',
    };
    const labels: Record<string, string> = {
      OPEN: 'Open',
      IN_PROGRESS: 'In Progress',
      RESOLVED: 'Resolved',
      CLOSED: 'Closed',
    };
    const s = styles[status] || styles.CLOSED;
    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${s}`}
      >
        {status === 'OPEN' && <Clock className="w-3 h-3" />}
        {status === 'IN_PROGRESS' && <AlertCircle className="w-3 h-3" />}
        {status === 'RESOLVED' && <CheckCircle className="w-3 h-3" />}
        {labels[status] || status}
      </span>
    );
  };

  const displayTickets = tickets;

  if (!mounted) return null;

  return (
    <>
      <Head>
        <title>Help & Support - Buyer | Carryofy</title>
        <meta name="description" content="Get help and support for your shopping experience on Carryofy" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <BuyerLayout>
        <div className="font-[Inter,sans-serif]">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-white text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
              <HelpCircle className="w-8 h-8 text-[#FF6B00]" />
              Help & Support
            </h1>
            <p className="text-[#ffcc99] text-lg mb-6">
              We're here to help! Find answers to common questions or contact support.
            </p>
            {/* Search bar */}
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 bg-[#1a1a1a] border border-[#FF6B00]/30 rounded-xl px-4 py-3 focus-within:border-[#FF6B00] transition-colors">
                <Search className="w-5 h-5 text-[#ffcc99]/60 shrink-0" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search for answers..."
                  className="flex-1 bg-transparent text-white placeholder:text-[#ffcc99]/50 text-base focus:outline-none"
                  aria-label="Search help"
                />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-8">
            {[
              { id: 'faq' as const, label: 'FAQs', icon: Book },
              { id: 'contact' as const, label: 'Contact Support', icon: MessageSquare },
              { id: 'tickets' as const, label: 'My Tickets', icon: AlertCircle },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition ${
                  activeTab === id ? 'bg-[#FF6B00] text-black' : 'bg-[#1a1a1a] text-[#ffcc99] hover:bg-[#FF6B00]/20 border border-[#FF6B00]/30'
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            ))}
          </div>

          {/* FAQ Tab */}
          {activeTab === 'faq' && (
            <div>
              {/* Category filter chips */}
              <div className="flex flex-wrap gap-2 mb-6">
                {FAQ_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFaqCategory(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                      faqCategory === cat
                        ? 'bg-[#FF6B00] text-black'
                        : 'border border-[#ffcc99]/40 text-[#ffcc99] hover:border-[#FF6B00]/50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredFaqs.map((faq, index) => {
                  const Icon = faq.icon;
                  const isExpanded = expandedFaq === index;
                  const feedback = faqFeedback[index];
                  return (
                    <div
                      key={index}
                      className="bg-[#1a1a1a] border border-[#FF6B00]/30 rounded-xl overflow-hidden hover:border-[#FF6B00]/60 transition"
                    >
                      <button
                        onClick={() => setExpandedFaq(isExpanded ? null : index)}
                        className="w-full text-left p-6 flex items-start gap-4"
                      >
                        <div className="p-3 bg-[#FF6B00]/10 rounded-xl shrink-0">
                          <Icon className="w-6 h-6 text-[#FF6B00]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white text-lg font-bold pr-6">{faq.question}</h3>
                          {!isExpanded && (
                            <p className="text-[#ffcc99]/70 text-sm mt-1 truncate">{faq.answer.slice(0, 60)}...</p>
                          )}
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-[#ffcc99]/60 shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-[#ffcc99]/60 shrink-0" />
                        )}
                      </button>
                      {isExpanded && (
                        <div className="px-6 pb-6 pt-0 -mt-2">
                          <p className="text-[#ffcc99] leading-relaxed pl-[4.5rem]">{faq.answer}</p>
                          <div className="flex items-center gap-4 pl-[4.5rem] mt-4 pt-4 border-t border-[#FF6B00]/20">
                            <span className="text-sm text-[#ffcc99]/70">Was this helpful?</span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setFaqFeedback(prev => ({ ...prev, [index]: 'up' }))}
                                className={`p-2 rounded-lg transition ${
                                  feedback === 'up' ? 'bg-[#FF6B00]/20 text-[#FF6B00]' : 'hover:bg-[#1a1a1a] text-[#ffcc99]/70'
                                }`}
                                aria-label="Helpful"
                              >
                                <ThumbsUp className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setFaqFeedback(prev => ({ ...prev, [index]: 'down' }))}
                                className={`p-2 rounded-lg transition ${
                                  feedback === 'down' ? 'bg-[#FF6B00]/20 text-[#FF6B00]' : 'hover:bg-[#1a1a1a] text-[#ffcc99]/70'
                                }`}
                                aria-label="Not helpful"
                              >
                                <ThumbsDown className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Contact Support Tab */}
          {activeTab === 'contact' && (
            <div className="max-w-3xl space-y-8">
              {/* Contact options side by side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#1a1a1a] border border-[#FF6B00]/30 rounded-xl p-6 flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-full bg-[#FF6B00]/20 flex items-center justify-center mb-4">
                    <MessageSquare className="w-7 h-7 text-[#FF6B00]" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-1">Chat with us</h3>
                  <p className="text-[#ffcc99] text-sm mb-4">Available Mon–Fri, 8am–8pm WAT</p>
                  <button
                    type="button"
                    className="w-full px-4 py-3 bg-[#FF6B00] text-black rounded-xl font-bold hover:bg-[#e55f00] transition"
                  >
                    Start Chat
                  </button>
                </div>
                <div className="bg-[#1a1a1a] border border-[#FF6B00]/30 rounded-xl p-6 flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-full bg-[#FF6B00]/20 flex items-center justify-center mb-4">
                    <Mail className="w-7 h-7 text-[#FF6B00]" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-1">Send us a message</h3>
                  <p className="text-[#ffcc99] text-sm mb-4">We reply within 24 hours</p>
                  <a
                    href="mailto:support@carryofy.com"
                    className="w-full px-4 py-3 border border-[#FF6B00] text-[#FF6B00] rounded-xl font-bold hover:bg-[#FF6B00]/10 transition text-center"
                  >
                    Send Email
                  </a>
                </div>
              </div>

              {/* Contact form */}
              <div className="bg-[#1a1a1a] border border-[#FF6B00]/30 rounded-xl p-8">
                <h2 className="text-white text-xl font-bold mb-6">Submit a ticket</h2>
                {message && (
                  <div
                    className={`mb-6 p-4 rounded-xl ${
                      message.type === 'success'
                        ? 'bg-emerald-500/10 border border-emerald-500/50 text-emerald-400'
                        : 'bg-red-500/10 border border-red-500/50 text-red-400'
                    }`}
                  >
                    {message.text}
                  </div>
                )}
                <form onSubmit={handleSubmitTicket} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">Name</label>
                      <input
                        type="text"
                        name="name"
                        value={contactForm.name}
                        onChange={handleContactFormChange}
                        className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#FF6B00]/30 rounded-xl text-white focus:outline-none focus:border-[#FF6B00]"
                      />
                    </div>
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={contactForm.email}
                        onChange={handleContactFormChange}
                        className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#FF6B00]/30 rounded-xl text-white focus:outline-none focus:border-[#FF6B00]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Subject</label>
                    <select
                      name="subjectOption"
                      value={contactForm.subjectOption}
                      onChange={handleContactFormChange}
                      className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#FF6B00]/30 rounded-xl text-white focus:outline-none focus:border-[#FF6B00]"
                    >
                      <option value="Order Issue">Order Issue</option>
                      <option value="Payment">Payment</option>
                      <option value="Delivery">Delivery</option>
                      <option value="Bulk Order">Bulk Order</option>
                      <option value="Account">Account</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Message *</label>
                    <textarea
                      name="message"
                      value={contactForm.message}
                      onChange={handleContactFormChange}
                      placeholder="Describe your issue or question..."
                      rows={5}
                      className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#FF6B00]/30 rounded-xl text-white placeholder:text-[#ffcc99]/50 focus:outline-none focus:border-[#FF6B00] resize-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Attach file (optional)</label>
                    <input
                      type="file"
                      className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#FF6B00]/30 rounded-xl text-[#ffcc99] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#FF6B00]/20 file:text-[#FF6B00] file:font-medium"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#FF6B00] text-black rounded-xl font-bold hover:bg-[#e55f00] disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <Send className="w-5 h-5" />
                    {submitting ? 'Submitting...' : 'Submit Ticket'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* My Tickets Tab */}
          {activeTab === 'tickets' && (
            <div>
              {loadingTickets ? (
                <div className="text-center py-12">
                  <div className="inline-block h-12 w-12 animate-spin rounded-full border-2 border-[#FF6B00] border-t-transparent" />
                  <p className="text-[#ffcc99] mt-4">Loading tickets...</p>
                </div>
              ) : displayTickets.length === 0 ? (
                <div className="bg-[#1a1a1a] border border-[#FF6B00]/30 rounded-xl p-12 text-center">
                  <MessageSquare className="w-16 h-16 text-[#ffcc99]/60 mx-auto mb-4" />
                  <h3 className="text-white text-xl font-bold mb-2">No tickets yet</h3>
                  <p className="text-[#ffcc99] mb-6">
                    Need help? Start a chat or send us a message.
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <button
                      onClick={() => setActiveTab('contact')}
                      className="px-6 py-3 bg-[#FF6B00] text-black rounded-xl font-bold hover:bg-[#e55f00] transition"
                    >
                      Contact Support
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {displayTickets.map(ticket => (
                    <div
                      key={ticket.id}
                      className="bg-[#1a1a1a] border border-[#FF6B00]/30 rounded-xl p-6 hover:border-[#FF6B00]/60 transition"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-[#ffcc99]/70 text-sm font-mono">{ticket.id.slice(0, 8)}</span>
                            <span className="px-2 py-0.5 rounded bg-[#FF6B00]/20 text-[#FF6B00] text-xs font-medium capitalize">
                              {ticket.category.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <h3 className="text-white font-bold text-lg truncate">{ticket.subject}</h3>
                          <p className="text-[#ffcc99] text-sm">{formatDate(ticket.createdAt)}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {getStatusBadge(ticket.status)}
                          <button className="px-4 py-2 border border-[#FF6B00]/50 text-[#FF6B00] rounded-lg text-sm font-medium hover:bg-[#FF6B00]/10 transition">
                            View Thread
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </BuyerLayout>
    </>
  );
}
