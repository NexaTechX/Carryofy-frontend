import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import BuyerLayout from '../../components/buyer/BuyerLayout';
import { tokenManager, userManager } from '../../lib/auth';
import apiClient from '../../lib/api/client';
import { 
  HelpCircle, 
  MessageSquare, 
  Mail, 
  Phone,
  Send,
  CheckCircle,
  Clock,
  AlertCircle,
  Book,
  Package,
  ShoppingCart,
  Truck,
  CreditCard,
  RefreshCw
} from 'lucide-react';

interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  adminNotes?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function BuyerHelpPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'faq' | 'contact' | 'tickets'>('faq');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Contact form state
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
    category: 'orders',
    priority: 'MEDIUM' as const,
  });

  useEffect(() => {
    setMounted(true);
    // Check authentication
    if (!tokenManager.isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    const user = userManager.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (user.role && user.role !== 'BUYER' && user.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    // Fetch support tickets
    if (activeTab === 'tickets') {
      fetchTickets();
    }
  }, [router, activeTab]);

  const fetchTickets = async () => {
    setLoadingTickets(true);
    try {
      const response = await apiClient.get('/support/tickets');
      const ticketsData = response.data.data || response.data;
      setTickets(Array.isArray(ticketsData) ? ticketsData : []);
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
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post('/support/tickets', contactForm);
      
      setMessage({ type: 'success', text: 'Support ticket submitted successfully!' });
      setContactForm({
        subject: '',
        message: '',
        category: 'orders',
        priority: 'MEDIUM',
      });
      // Switch to tickets tab and refresh
      setTimeout(() => {
        setActiveTab('tickets');
        fetchTickets();
        setMessage(null);
      }, 2000);
    } catch (error: any) {
      console.error('Error submitting ticket:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to submit ticket. Please try again.' 
      });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const faqs = [
    {
      icon: ShoppingCart,
      question: 'How do I place an order?',
      answer: 'Browse products, add items to your cart, and proceed to checkout. Fill in your delivery details and complete payment to place your order.',
    },
    {
      icon: Truck,
      question: 'How can I track my order?',
      answer: 'Go to "My Orders" from the sidebar menu. Click on any order to view its tracking status and delivery updates.',
    },
    {
      icon: CreditCard,
      question: 'What payment methods do you accept?',
      answer: 'We accept various payment methods including bank transfers, card payments, and digital wallets for your convenience.',
    },
    {
      icon: RefreshCw,
      question: 'What is your return policy?',
      answer: 'We offer a 7-day return policy for most products. Items must be unused and in original packaging. Contact support to initiate a return.',
    },
    {
      icon: Package,
      question: 'How long does delivery take?',
      answer: 'Delivery typically takes 3-7 business days depending on your location. Express delivery options are available for faster shipping.',
    },
    {
      icon: HelpCircle,
      question: 'How do I contact a seller?',
      answer: 'You can view seller information on each product page. For support with orders, contact our customer service team.',
    },
  ];

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      OPEN: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      IN_PROGRESS: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
      RESOLVED: 'bg-green-500/10 text-green-400 border-green-500/30',
      CLOSED: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
    };

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${statusStyles[status as keyof typeof statusStyles]}`}>
        {status === 'OPEN' && <Clock className="w-3 h-3" />}
        {status === 'IN_PROGRESS' && <AlertCircle className="w-3 h-3" />}
        {status === 'RESOLVED' && <CheckCircle className="w-3 h-3" />}
        {status}
      </span>
    );
  };

  if (!mounted) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Help & Support - Buyer | Carryofy</title>
        <meta name="description" content="Get help and support for your shopping experience on Carryofy" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <BuyerLayout>
        <div>
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-white text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
              <HelpCircle className="w-8 h-8 text-[#ff6600]" />
              Help & Support
            </h1>
            <p className="text-[#ffcc99] text-lg">
              We're here to help! Find answers to common questions or contact support.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => setActiveTab('faq')}
              className={`px-6 py-3 rounded-xl font-bold transition ${
                activeTab === 'faq'
                  ? 'bg-[#ff6600] text-black'
                  : 'bg-[#1a1a1a] text-[#ffcc99] hover:bg-[#ff6600]/20 border border-[#ff6600]/30'
              }`}
            >
              <Book className="w-5 h-5 inline-block mr-2" />
              FAQs
            </button>
            <button
              onClick={() => setActiveTab('contact')}
              className={`px-6 py-3 rounded-xl font-bold transition ${
                activeTab === 'contact'
                  ? 'bg-[#ff6600] text-black'
                  : 'bg-[#1a1a1a] text-[#ffcc99] hover:bg-[#ff6600]/20 border border-[#ff6600]/30'
              }`}
            >
              <MessageSquare className="w-5 h-5 inline-block mr-2" />
              Contact Support
            </button>
            <button
              onClick={() => setActiveTab('tickets')}
              className={`px-6 py-3 rounded-xl font-bold transition ${
                activeTab === 'tickets'
                  ? 'bg-[#ff6600] text-black'
                  : 'bg-[#1a1a1a] text-[#ffcc99] hover:bg-[#ff6600]/20 border border-[#ff6600]/30'
              }`}
            >
              <AlertCircle className="w-5 h-5 inline-block mr-2" />
              My Tickets
            </button>
          </div>

          {/* FAQ Tab */}
          {activeTab === 'faq' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {faqs.map((faq, index) => {
                const Icon = faq.icon;
                return (
                  <div
                    key={index}
                    className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6 hover:border-[#ff6600] transition"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-[#ff6600]/10 rounded-xl">
                        <Icon className="w-6 h-6 text-[#ff6600]" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white text-lg font-bold mb-2">{faq.question}</h3>
                        <p className="text-[#ffcc99] leading-relaxed">{faq.answer}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Contact Support Tab */}
          {activeTab === 'contact' && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-8">
                <h2 className="text-white text-2xl font-bold mb-6">Submit a Support Ticket</h2>
                
                {message && (
                  <div className={`mb-6 p-4 rounded-xl ${
                    message.type === 'success'
                      ? 'bg-green-500/10 border border-green-500/50 text-green-400'
                      : 'bg-red-500/10 border border-red-500/50 text-red-400'
                  }`}>
                    {message.text}
                  </div>
                )}

                <form onSubmit={handleSubmitTicket} className="space-y-6">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Category
                    </label>
                    <select
                      name="category"
                      value={contactForm.category}
                      onChange={handleContactFormChange}
                      className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#ff6600]/30 rounded-xl text-white focus:outline-none focus:border-[#ff6600]"
                    >
                      <option value="orders">Orders</option>
                      <option value="products">Products</option>
                      <option value="payments">Payments</option>
                      <option value="delivery">Delivery</option>
                      <option value="returns">Returns & Refunds</option>
                      <option value="account">Account</option>
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
                      className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#ff6600]/30 rounded-xl text-white focus:outline-none focus:border-[#ff6600]"
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
                      className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#ff6600]/30 rounded-xl text-white placeholder-[#ffcc99]/50 focus:outline-none focus:border-[#ff6600]"
                      required
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
                      placeholder="Provide detailed information about your issue..."
                      rows={6}
                      className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#ff6600]/30 rounded-xl text-white placeholder-[#ffcc99]/50 focus:outline-none focus:border-[#ff6600] resize-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#ff6600] text-black rounded-xl font-bold hover:bg-[#cc5200] disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <Send className="w-5 h-5" />
                    {submitting ? 'Submitting...' : 'Submit Ticket'}
                  </button>
                </form>
              </div>

              {/* Contact Information */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6 text-center">
                  <Mail className="w-8 h-8 text-[#ff6600] mx-auto mb-3" />
                  <h3 className="text-white font-bold mb-1">Email Us</h3>
                  <p className="text-[#ffcc99] text-sm">support@carryofy.com</p>
                </div>
                <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6 text-center">
                  <Phone className="w-8 h-8 text-[#ff6600] mx-auto mb-3" />
                  <h3 className="text-white font-bold mb-1">Call Us</h3>
                  <p className="text-[#ffcc99] text-sm">+234 916 678 3040</p>
                </div>
              </div>
            </div>
          )}

          {/* My Tickets Tab */}
          {activeTab === 'tickets' && (
            <div>
              {loadingTickets ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff6600]"></div>
                  <p className="text-[#ffcc99] mt-4">Loading tickets...</p>
                </div>
              ) : tickets.length === 0 ? (
                <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-12 text-center">
                  <MessageSquare className="w-16 h-16 text-[#ffcc99] mx-auto mb-4" />
                  <h3 className="text-white text-xl font-bold mb-2">No Support Tickets</h3>
                  <p className="text-[#ffcc99] mb-6">
                    You haven't submitted any support tickets yet.
                  </p>
                  <button
                    onClick={() => setActiveTab('contact')}
                    className="px-6 py-3 bg-[#ff6600] text-black rounded-xl font-bold hover:bg-[#cc5200] transition"
                  >
                    Create Ticket
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6 hover:border-[#ff6600] transition"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div>
                          <h3 className="text-white text-lg font-bold mb-2">{ticket.subject}</h3>
                          <div className="flex flex-wrap items-center gap-3 text-sm">
                            <span className="text-[#ffcc99]">Category: {ticket.category}</span>
                            <span className="text-[#ffcc99]/50">•</span>
                            <span className="text-[#ffcc99]">
                              {new Date(ticket.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        {getStatusBadge(ticket.status)}
                      </div>
                      <p className="text-[#ffcc99] mb-4">{ticket.message}</p>
                      {ticket.adminNotes && (
                        <div className="mt-4 p-4 bg-[#ff6600]/10 border border-[#ff6600]/30 rounded-lg">
                          <p className="text-[#ffcc99] text-sm font-medium mb-1">Admin Response:</p>
                          <p className="text-white">{ticket.adminNotes}</p>
                        </div>
                      )}
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

