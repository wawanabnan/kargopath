import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';

const FAQS = [
  {
    q: "What type of companies does KargoPath serve?",
    a: "We serve B2B clients including manufacturers, importers, exporters, retailers, and businesses requiring professional logistics solutions. We do not serve retail or individual customers."
  },
  {
    q: "Do you handle international freight forwarding?",
    a: "Yes, we provide international freight forwarding via sea, air, and land to 50+ countries. We handle both import and export shipments with full customs clearance support."
  },
  {
    q: "How fast can I receive a quotation?",
    a: "Standard routes are quoted within 2-4 hours during business hours. Complex project cargo may take up to 24 hours. Our technology platform enables faster quotation processing."
  },
  {
    q: "Are you a licensed customs broker?",
    a: "Yes, we are a licensed PPJK (Pengusaha Pengurusan Jasa Kepabeanan) customs broker, authorized to handle all import/export customs clearance in Indonesia."
  },
  {
    q: "Can you handle project cargo and heavy lift?",
    a: "Yes, we specialize in project cargo including heavy lift, oversized cargo (OOG), break bulk, and specialized industrial equipment requiring special handling."
  },
];

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="font-roboto text-slate-800 bg-gray-50">

      {/* ── HERO ────────────────────────────────────────── */}
      <section className="min-h-screen flex items-center bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/kargopath_ex1.jpg"
            alt=""
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-950/60 via-blue-900/30 to-blue-950/60"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto">
            
            <h1 className="font-oswald text-3xl md:text-5xl font-bold tracking-wide text-white mb-6 leading-tight uppercase">
              Integrated Cargo Solutions.<br />
              <span className="text-xl md:text-2xl font-bold text-white">Powered by Tech.</span>
            </h1>
            
            <p className="text-sm md:text-base text-white/80 mb-10 leading-relaxed max-w-2xl mx-auto">
              Combining decades of logistics expertise with advanced technology to deliver your cargo faster and safer. We manage your shipments across Sea, Air, and Land seamlessly from a single centralized dashboard.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link to={isAuthenticated ? '/dashboard' : '/register'}
                className="inline-flex items-center justify-center px-8 py-4 bg-white hover:bg-slate-100 text-slate-900 font-bold transition-all">
                {isAuthenticated ? 'Go to Dashboard' : 'Try Platform Now'}
              </Link>
              <Link to="/quote"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-8 py-4 border border-white/30 text-white hover:bg-white/10 font-bold transition-all">
                Request Quotation
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATISTICS ───────────────────────────────────────── */}
      <section className="py-16 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: '1,500+', label: 'Shipments Delivered', icon: '📦' },
              { number: '50+', label: 'Countries Reached', icon: '🌍' },
              { number: '98%', label: 'On-Time Delivery', icon: '⏱️' },
              { number: '24/7', label: 'Customer Support', icon: '💬' },
            ].map(stat => (
              <div key={stat.label} className="space-y-3">
                <div className="text-4xl">{stat.icon}</div>
                <div className="text-4xl md:text-5xl font-extrabold text-slate-800">{stat.number}</div>
                <div className="text-sm font-medium text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CORE 3PL SERVICES ────────────────────────────────────────── */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center max-w-3xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
              Complete 3PL Solutions
            </p>
            <h2 className="font-montserrat text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Comprehensive Logistics Services for Your Business
            </h2>
            <p className="text-lg text-slate-500">
              From freight forwarding to customs clearance, we provide end-to-end logistics solutions powered by technology.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                icon: '📦',
                title: 'Freight Forwarding',
                desc: 'International & domestic cargo forwarding via sea, air, and land. Technology-enabled instant quotations and real-time tracking for businesses.',
                link: '/services'
              },
              { 
                icon: '🛃',
                title: 'Customs Brokerage',
                desc: 'Licensed PPJK customs broker. Expert handling of import/export clearance, duty calculation, and regulatory compliance.',
                link: '/services'
              },
              { 
                icon: '🏗️',
                title: 'Project Cargo',
                desc: 'Specialized logistics for heavy lift, oversized, and out-of-gauge cargo. Expert project management for complex shipments.',
                link: '/services'
              },
            ].map(s => (
              <Link key={s.title} to={s.link} className="group">
                <div className="bg-white p-10 border border-slate-200 hover:border-slate-400 hover:shadow-lg transition-all h-full">
                  <span className="text-4xl block mb-6">{s.icon}</span>
                  <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-slate-700 transition-colors">
                    {s.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed mb-4">{s.desc}</p>
                  <span className="text-slate-700 font-semibold text-sm group-hover:underline">
                    Learn More →
                  </span>
                </div>
              </Link>
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <p className="text-sm text-slate-500 mb-4">
              <strong className="text-slate-700">B2B Focused:</strong> Our services are designed for companies and business professionals, not retail customers.
            </p>
            <Link to="/services" className="inline-flex items-center gap-2 px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all">
              View All Services →
            </Link>
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE US ────────────────────────────────────────────── */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
              Why KargoPath
            </p>
            <h2 className="font-montserrat text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Why Leading Companies Choose KargoPath
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              We're not just another freight forwarder. We're your logistics technology partner.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: '🏆',
                title: 'Industry Expertise',
                desc: '15+ years of combined experience in international freight forwarding and customs brokerage.'
              },
              {
                icon: '💻',
                title: 'Technology First',
                desc: 'Built by logistics professionals who understand the pain points. Modern tech stack for reliability.'
              },
              {
                icon: '🌐',
                title: 'Global Network',
                desc: 'Strategic partnerships with 200+ carriers and agents across 50+ countries worldwide.'
              },
              {
                icon: '💰',
                title: 'Transparent Pricing',
                desc: 'No hidden fees. All charges itemized upfront. Compare rates and make informed decisions.'
              },
              {
                icon: '🔒',
                title: 'Secure & Compliant',
                desc: 'Licensed PPJK customs broker. IATA certified. Full cargo insurance coverage on all shipments.'
              },
              {
                icon: '⚡',
                title: 'Fast Response',
                desc: 'Average quotation time: 3 hours. Average support response: 15 minutes. We value your time.'
              },
            ].map((item, idx) => (
              <div key={idx} className="bg-slate-50 p-8 border border-slate-200 hover:border-slate-400 hover:shadow-md transition-all">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INDUSTRIES SERVED ────────────────────────────────────────── */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
              Industries We Serve
            </p>
            <h2 className="font-montserrat text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Trusted by Leading Industries
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              We provide specialized 3PL solutions for diverse business sectors across Indonesia.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '🏭', title: 'Manufacturing', desc: 'Raw materials & finished goods' },
              { icon: '🏪', title: 'Retail & E-commerce', desc: 'Distribution & fulfillment' },
              { icon: '🏗️', title: 'Construction', desc: 'Heavy equipment & materials' },
              { icon: '⚡', title: 'Energy & Mining', desc: 'Project cargo & specialized' },
              { icon: '🍎', title: 'FMCG', desc: 'Fast-moving consumer goods' },
              { icon: '💊', title: 'Pharmaceutical', desc: 'Temperature-controlled' },
              { icon: '🚗', title: 'Automotive', desc: 'Parts & vehicle logistics' },
              { icon: '📦', title: 'Import/Export', desc: 'International trade' },
            ].map(industry => (
              <div key={industry.title} className="bg-white p-6 border border-slate-200 hover:border-slate-400 hover:shadow-md transition-all text-center">
                <div className="text-4xl mb-3">{industry.icon}</div>
                <h3 className="font-bold text-slate-900 mb-2">{industry.title}</h3>
                <p className="text-sm text-slate-500">{industry.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FITUR UNGGULAN ──────────────────────────────────────── */}
      <section className="py-24 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center max-w-3xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
              Platform Features
            </p>
            <h2 className="font-montserrat text-3xl font-bold text-slate-900 mb-4">The Future of Logistics</h2>
            <p className="text-lg text-slate-500">
              KargoPath is designed specifically to eliminate inefficiencies in traditional freight forwarding.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { 
                icon: '⚡',
                title: 'Instant Quotation',
                desc: 'Stop waiting days for email replies. Get and compare route prices transparently directly from the system.' 
              },
              { 
                icon: '💻',
                title: 'Smart Online Booking',
                desc: 'Approve quotes with a single click. The system automatically creates shipment drafts without manual data entry.' 
              },
              { 
                icon: '🗂️',
                title: 'Centralized Control',
                desc: 'All important documents (B/L, AWB, Invoices) and cargo journey history are securely stored in one place.' 
              },
            ].map(s => (
              <div key={s.title} className="bg-white p-10 border border-slate-200">
                <span className="text-3xl block mb-6">{s.icon}</span>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{s.title}</h3>
                <p className="text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INTEGRASI & KEPERCAYAAN ──────────────────────────────────── */}
      <section className="py-16 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-8">Your Cargo is in Good Hands</p>
          <div className="flex flex-wrap justify-center gap-8 opacity-50 grayscale">
            {['IATA', 'FIATA', 'GAFEKSI', 'BEA CUKAI RI'].map(brand => (
              <div key={brand} className="px-6 py-3 border-2 border-slate-300 font-bold text-slate-500 text-sm tracking-widest uppercase">
                {brand}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section id="faq" className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-montserrat text-3xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-slate-500">Quick answers to common questions about our 3PL services.</p>
          </div>
          
          <div className="space-y-4">
            {FAQS.map((faq, idx) => (
              <div key={idx} className="bg-white border border-slate-200 p-6">
                <h4 className="text-lg font-bold text-slate-900 mb-2">{faq.q}</h4>
                <p className="text-slate-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <Link to="/faq" className="inline-flex items-center gap-2 text-slate-700 font-semibold hover:underline text-lg">
              View All FAQs →
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <section className="bg-white border-t border-slate-100 py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-montserrat text-4xl font-bold text-slate-900 mb-6">Ready to Transform Your Freight Operations?</h2>
          <p className="text-slate-500 text-lg mb-10 max-w-2xl mx-auto">
            Join the first digital 3PL platform designed for maximum efficiency in Indonesia.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={isAuthenticated ? '/dashboard' : '/register'}
              className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all">
              {isAuthenticated ? 'Go to Dashboard' : 'Create Free Account'}
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
