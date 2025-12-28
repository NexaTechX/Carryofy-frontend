import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { useState } from 'react';
import { Mail, MapPin, Send } from 'lucide-react';
import SEO from '../components/seo/SEO';
import { CombinedSchema } from '../components/seo/JsonLd';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });

      // Reset success message after 5 seconds
      setTimeout(() => {
        setSubmitStatus('idle');
      }, 5000);
    }, 1000);
  };

  const contactKeywords = [
    // Contact intent keywords
    'contact Carryofy',
    'Carryofy support',
    'Carryofy customer service',
    'Carryofy phone number',
    'Carryofy email',
    'Carryofy address Lagos',
    'reach Carryofy',
    'Carryofy help',
    
    // Support keywords
    'ecommerce support Nigeria',
    'delivery support Lagos',
    'seller support Nigeria',
    'buyer help Nigeria',
    'order help Nigeria',
    'shipping support Lagos',
    
    // Business keywords
    'Carryofy partnership',
    'Carryofy business inquiries',
    'logistics partnership Nigeria',
    'ecommerce partnership Lagos',
    
    // Location keywords
    'Carryofy Lagos office',
    'Carryofy Nigeria contact',
    'ecommerce company Lagos contact',
  ].join(', ');

  // FAQ data for structured data
  const faqs = [
    {
      question: 'How do I become a seller on Carryofy?',
      answer: 'Simply click on "Become a Seller" in the navigation, create an account, and follow the onboarding process. Our team will review your application and guide you through the setup.',
    },
    {
      question: 'How long does delivery take?',
      answer: 'Delivery times vary by location, but typically range from same-day delivery in Lagos to 2-5 business days within major cities and 5-10 business days for other areas. You can track your order in real-time through our platform.',
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept various payment methods including bank transfers, debit/credit cards (Visa, Mastercard), and mobile money. All transactions are secure and encrypted.',
    },
    {
      question: 'How can I track my order?',
      answer: 'Once your order is confirmed, you\'ll receive a tracking number via email and SMS. You can use this to track your order status in real-time on our platform.',
    },
    {
      question: 'What is Carryofy\'s return policy?',
      answer: 'We offer a hassle-free return policy. If you\'re not satisfied with your purchase, you can initiate a return within 7 days of delivery. Contact our support team for assistance.',
    },
    {
      question: 'How do I contact Carryofy support?',
      answer: 'You can reach us via email at support@carryofy.com for general inquiries or partnerships@carryofy.com for business opportunities. Our support team is available Monday to Friday, 8am to 6pm WAT.',
    },
  ];

  return (
    <>
      <SEO
        title="Contact Carryofy - Customer Support, Business Inquiries & Partnerships | Lagos Nigeria"
        description="Get in touch with Carryofy for customer support, seller inquiries, logistics partnerships, or business opportunities in Nigeria. Email support@carryofy.com or visit our Lagos office. We're here to help grow your e-commerce business."
        keywords={contactKeywords}
        canonical="https://carryofy.com/contact"
        ogType="website"
        ogImage="https://carryofy.com/og/contact.png"
        ogImageAlt="Contact Carryofy - Customer Support Nigeria"
      />
      
      <CombinedSchema
        includeLocalBusiness
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Contact Us', url: '/contact' },
        ]}
        faqs={faqs}
      />
      
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow">
          {/* Hero Section */}
          <section className="bg-gradient-to-r from-primary/10 to-primary/5 py-12 sm:py-16 md:py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 text-gray-900">
                Contact Carryofy
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
                We&apos;re here to help. Get in touch with our team for any questions, support, or partnership inquiries.
              </p>
            </div>
          </section>

          {/* Contact Information & Form */}
          <section className="py-12 sm:py-16 bg-white">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto">
                {/* Contact Information */}
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-gray-900">
                    Get in Touch
                  </h2>
                  <p className="text-base sm:text-lg text-gray-600 mb-8 leading-relaxed">
                    Have a question or need support? We&apos;d love to hear from you. Send us a message
                    and we&apos;ll respond as soon as possible.
                  </p>

                  <div className="space-y-8">
                    <div className="space-y-6">
                      <address className="flex items-start not-italic">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mr-4">
                          <Mail className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">General Support</h3>
                          <a href="mailto:support@carryofy.com" className="text-sm sm:text-base text-gray-600 hover:text-primary transition">
                            support@carryofy.com
                          </a>
                        </div>
                      </address>

                      <address className="flex items-start not-italic">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mr-4">
                          <Mail className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">Partnerships & Logistics</h3>
                          <a href="mailto:partnerships@carryofy.com" className="text-sm sm:text-base text-gray-600 hover:text-primary transition">
                            partnerships@carryofy.com
                          </a>
                        </div>
                      </address>

                      <address className="flex items-start not-italic">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mr-4">
                          <MapPin className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">Office Location</h3>
                          <p className="text-sm sm:text-base text-gray-600">
                            Lagos, Nigeria
                          </p>
                        </div>
                      </address>
                    </div>

                    {/* Social Links */}
                    <div>
                      <h3 className="font-bold text-gray-900 mb-4">Follow Us</h3>
                      <div className="flex flex-wrap gap-3">
                        {[
                          { name: 'Instagram', url: 'https://instagram.com/carryofy' },
                          { name: 'Twitter/X', url: 'https://twitter.com/carryofy' },
                          { name: 'LinkedIn', url: 'https://linkedin.com/company/carryofy' },
                          { name: 'TikTok', url: 'https://tiktok.com/@carryofy' },
                        ].map((social) => (
                          <a 
                            key={social.name} 
                            href={social.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-gray-100 rounded-full text-sm font-medium text-gray-600 hover:bg-primary hover:text-white transition"
                          >
                            {social.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Form */}
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-gray-900">
                    Send us a Message
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                        placeholder="Your name"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                        placeholder="your.email@example.com"
                      />
                    </div>

                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                        Subject
                      </label>
                      <select
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                      >
                        <option value="">Select a subject</option>
                        <option value="general">General Inquiry</option>
                        <option value="seller">Seller Support</option>
                        <option value="buyer">Buyer Support</option>
                        <option value="technical">Technical Support</option>
                        <option value="partnership">Partnership</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                        Message
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={6}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition resize-none"
                        placeholder="Your message here..."
                      />
                    </div>

                    {submitStatus === 'success' && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
                        Thank you! Your message has been sent successfully. We&apos;ll get back to you soon.
                      </div>
                    )}

                    {submitStatus === 'error' && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                        Something went wrong. Please try again later.
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full px-6 sm:px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="animate-spin">⏳</span>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send Message
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="py-12 sm:py-16 bg-gray-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 sm:mb-12 text-gray-900">
                Frequently Asked Questions
              </h2>
              <div className="max-w-3xl mx-auto space-y-6">
                {faqs.map((faq, index) => (
                  <article key={index} className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {faq.question}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600">
                      {faq.answer}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}
