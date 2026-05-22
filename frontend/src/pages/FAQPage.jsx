import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';

const FAQ_CATEGORIES = [
  {
    category: 'General',
    questions: [
      {
        q: 'What is KargoPath?',
        a: 'KargoPath is a technology-enabled third-party logistics (3PL) provider in Indonesia. We offer comprehensive freight forwarding, customs brokerage, and project cargo solutions for businesses, powered by our digital logistics platform.'
      },
      {
        q: 'Who are your target clients?',
        a: 'We serve B2B clients including manufacturers, importers, exporters, retailers, distributors, and businesses requiring professional logistics solutions. We do not serve retail or individual customers.'
      },
      {
        q: 'What makes KargoPath different from traditional freight forwarders?',
        a: 'We combine decades of logistics expertise with modern technology. Our platform enables instant online quotations (2-4 hours), real-time shipment tracking, digital documentation, and automated booking — eliminating the manual processes and delays of traditional freight forwarders.'
      },
      {
        q: 'What areas do you serve?',
        a: 'We provide international freight forwarding to 50+ countries across Asia, Europe, and the Americas. Domestically, we cover all major industrial estates and ports across Java, Sumatra, Kalimantan, and Sulawesi.'
      },
    ]
  },
  {
    category: 'Freight Forwarding',
    questions: [
      {
        q: 'What transport modes do you support?',
        a: 'We provide multimodal freight forwarding via sea freight (FCL & LCL), air freight (express & standard), and land trucking (FTL & LTL). We can also arrange door-to-door delivery combining multiple transport modes.'
      },
      {
        q: 'Do you handle international shipments?',
        a: 'Yes, we specialize in international freight forwarding for both import and export. We handle all documentation, customs clearance, and coordinate with our global network of partners to ensure smooth delivery.'
      },
      {
        q: 'What is the difference between FCL and LCL?',
        a: 'FCL (Full Container Load) means you rent an entire container for your cargo. LCL (Less than Container Load) means your cargo shares container space with other shippers. FCL is more cost-effective for large volumes, while LCL is ideal for smaller shipments.'
      },
      {
        q: 'Can you handle dangerous goods (DG)?',
        a: 'Yes, we are IATA certified for dangerous goods handling. Our team is trained in DG classification, packaging, labeling, and documentation requirements for air, sea, and land transport.'
      },
      {
        q: 'Do you provide cargo insurance?',
        a: 'Yes, we offer comprehensive cargo insurance coverage for all shipments. Insurance can be arranged as part of your quotation and is highly recommended for high-value or sensitive cargo.'
      },
    ]
  },
  {
    category: 'Customs Brokerage',
    questions: [
      {
        q: 'Are you a licensed customs broker?',
        a: 'Yes, we are a licensed PPJK (Pengusaha Pengurusan Jasa Kepabeanan) customs broker, authorized by Indonesian Customs (Bea Cukai) to handle all import and export customs clearance procedures.'
      },
      {
        q: 'What documents are needed for customs clearance?',
        a: 'Typically you need: Commercial Invoice, Packing List, Bill of Lading (B/L) or Airway Bill (AWB), and Certificate of Origin. Additional documents may be required depending on the commodity (e.g., permits for restricted goods, health certificates for food/pharma).'
      },
      {
        q: 'How long does customs clearance take?',
        a: 'Standard customs clearance takes 1-3 business days for import and 1-2 days for export, assuming all documents are complete and correct. Complex cases or inspections may take longer.'
      },
      {
        q: 'Can you help with HS code classification?',
        a: 'Yes, our licensed customs brokers can assist with proper HS code classification for your products. Correct classification is crucial for accurate duty calculation and regulatory compliance.'
      },
    ]
  },
  {
    category: 'Project Cargo',
    questions: [
      {
        q: 'What is project cargo?',
        a: 'Project cargo refers to oversized, heavy, or complex shipments that require specialized handling, equipment, and permits. This includes industrial machinery, construction equipment, power generation equipment, and other out-of-gauge (OOG) cargo.'
      },
      {
        q: 'Can you handle oversized and heavy cargo?',
        a: 'Yes, we specialize in project cargo logistics including heavy lift operations, break bulk shipments, and out-of-gauge (OOG) cargo. We have experience with cargo weighing up to 100+ tons and requiring special equipment.'
      },
      {
        q: 'Do you provide route surveys for project cargo?',
        a: 'Yes, for complex project cargo, we conduct route surveys to assess road conditions, bridge clearances, overhead obstacles, and identify any potential challenges before transport begins.'
      },
    ]
  },
  {
    category: 'Quotation & Booking',
    questions: [
      {
        q: 'How fast can I receive a quotation?',
        a: 'Standard routes are quoted within 2-4 hours during business hours (Mon-Fri 08:00-17:00 WIB). Complex project cargo or special requirements may take up to 24 hours. Our technology platform enables faster quotation processing compared to traditional methods.'
      },
      {
        q: 'Do I need an account to request a quote?',
        a: 'No, you can request a quotation without creating an account. However, creating a free account gives you access to our client dashboard where you can track quotations, view shipment history, and manage documents.'
      },
      {
        q: 'What information do I need to provide for a quotation?',
        a: 'You need: origin and destination (port/city/address), transport mode preference, cargo details (commodity, weight, volume, dimensions), desired shipping date, and any special requirements (temperature control, dangerous goods, etc.).'
      },
      {
        q: 'Are your quotations binding?',
        a: 'Yes, our quotations are valid for the period specified (typically 7-14 days). All charges are itemized upfront with no hidden fees. Final invoice will match the accepted quotation unless there are changes to cargo specifications or additional services requested.'
      },
      {
        q: 'How do I book a shipment after receiving a quotation?',
        a: 'Once you accept the quotation through our platform, our operations team will immediately create the shipment booking and contact you to coordinate pickup and documentation requirements.'
      },
    ]
  },
  {
    category: 'Technology Platform',
    questions: [
      {
        q: 'Can I track my shipment online?',
        a: 'Yes, every shipment gets a unique tracking number. You can monitor real-time status updates, view milestone progress, and receive notifications through your client dashboard or our tracking page.'
      },
      {
        q: 'How do I access the client dashboard?',
        a: 'Create a free account on our platform, then log in to access your dashboard. From there you can request quotations, view shipment history, track cargo, download documents, and manage your profile.'
      },
      {
        q: 'Is my data secure on your platform?',
        a: 'Yes, we use industry-standard encryption and security measures to protect your data. All sensitive information is encrypted in transit and at rest. We comply with data protection regulations and never share your information with third parties without consent.'
      },
    ]
  },
  {
    category: 'Payment & Documentation',
    questions: [
      {
        q: 'What payment methods do you accept?',
        a: 'We accept bank transfer (wire transfer), credit cards, and corporate billing. Payment terms can be negotiated for regular clients with established credit. Prepayment is required for first-time clients.'
      },
      {
        q: 'When is payment due?',
        a: 'Payment terms depend on the service and client relationship. Standard terms are: prepayment for new clients, net 7-14 days for established clients. Specific terms will be stated in your quotation.'
      },
      {
        q: 'How do I receive shipping documents?',
        a: 'All shipping documents (B/L, AWB, invoices, packing lists, customs documents) are available for download through your client dashboard. We also send copies via email. Original documents can be couriered if required.'
      },
      {
        q: 'Do you provide tax invoices?',
        a: 'Yes, we provide official tax invoices (Faktur Pajak) for all services as required by Indonesian tax regulations. Invoices are available through your dashboard and sent via email.'
      },
    ]
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div className="min-h-screen font-sans bg-white text-slate-900">
      {/* Header */}
      <div className="bg-slate-900 pt-28 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(59,130,246,0.12),transparent_60%)]" />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-3">Help Center</p>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-5">
            Frequently Asked Questions
          </h1>
          <p className="text-slate-400 text-lg font-medium">
            Everything you need to know about our 3PL services, platform, and processes.
          </p>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="max-w-4xl mx-auto px-4 py-24">
        <div className="space-y-16">
          {FAQ_CATEGORIES.map((cat, catIdx) => (
            <div key={catIdx}>
              <h2 className="text-2xl font-bold text-slate-900 mb-6 pb-3 border-b-2 border-blue-600">
                {cat.category}
              </h2>
              <div className="space-y-4">
                {cat.questions.map((faq, faqIdx) => {
                  const globalIdx = `${catIdx}-${faqIdx}`;
                  const isOpen = openIndex === globalIdx;
                  
                  return (
                    <div key={faqIdx} className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setOpenIndex(isOpen ? null : globalIdx)}
                        className="w-full px-6 py-5 text-left flex items-start justify-between gap-4 hover:bg-slate-100 transition-colors"
                      >
                        <h3 className="text-lg font-bold text-slate-900 flex-1">{faq.q}</h3>
                        <svg
                          className={`w-5 h-5 text-blue-600 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {isOpen && (
                        <div className="px-6 pb-5">
                          <p className="text-slate-600 leading-relaxed">{faq.a}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Still Have Questions CTA */}
      <section className="bg-slate-50 border-t border-slate-200 py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Still Have Questions?</h2>
          <p className="text-lg text-slate-600 mb-8">
            Our team is here to help. Contact us and we'll get back to you within 1 business day.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact" className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl hover:-translate-y-1 transition-all inline-block">
              Contact Our Team →
            </Link>
            <Link to="/quote" target="_blank" rel="noopener noreferrer" className="px-10 py-4 bg-transparent border-2 border-slate-300 text-slate-700 hover:border-blue-600 hover:text-blue-600 font-bold rounded-2xl transition-all inline-block">
              Request a Quote
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
