import React from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen font-sans bg-white text-slate-900">
      {/* Header */}
      <div className="bg-slate-900 pt-28 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(59,130,246,0.12),transparent_60%)]" />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-3">Who We Are</p>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-5">About KargoPath</h1>
          <p className="text-slate-400 text-lg font-medium">
            Indonesia's technology-enabled 3PL provider, modernizing freight forwarding for businesses.
          </p>
        </div>
      </div>

      {/* Company Story */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Our Story</h2>
            <div className="space-y-4 text-lg text-slate-600 leading-relaxed">
              <p>
                Founded in 2020, KargoPath was born from a vision to modernize Indonesia's freight forwarding industry. 
                Our founders, veterans of both logistics and technology sectors, recognized a critical gap: businesses were 
                struggling with manual processes, opaque pricing, and lack of real-time visibility in their supply chains.
              </p>
              <p>
                We set out to build the platform we wished existed when we were managing complex supply chains — a 
                technology-enabled 3PL provider that combines decades of logistics expertise with modern digital infrastructure.
              </p>
              <p>
                Today, KargoPath serves manufacturers, importers, exporters, and businesses across Indonesia, providing 
                comprehensive freight forwarding, customs brokerage, and project cargo solutions powered by our proprietary 
                logistics platform.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-white p-10 rounded-2xl border border-slate-200">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Our Mission</h3>
              <p className="text-slate-600 leading-relaxed">
                To democratize access to world-class logistics services through technology, making international 
                trade simpler and more efficient for Indonesian businesses of all sizes.
              </p>
            </div>
            <div className="bg-white p-10 rounded-2xl border border-slate-200">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Our Vision</h3>
              <p className="text-slate-600 leading-relaxed">
                To become Indonesia's leading technology-enabled 3PL provider, recognized for innovation, 
                reliability, and exceptional service in freight forwarding and supply chain solutions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-24 bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Our Core Values</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              The principles that guide every decision we make and every service we provide.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: '🔍',
                title: 'Transparency',
                desc: 'No hidden fees, no surprises. All charges itemized upfront so you can make informed decisions.'
              },
              {
                icon: '🛡️',
                title: 'Reliability',
                desc: 'Your cargo, our responsibility. We deliver on our promises with 98% on-time delivery rate.'
              },
              {
                icon: '💡',
                title: 'Innovation',
                desc: 'Constantly improving our platform and processes to provide better, faster logistics solutions.'
              },
              {
                icon: '🤝',
                title: 'Customer Focus',
                desc: 'Your success is our success. We build long-term partnerships, not just transactions.'
              },
            ].map((value, idx) => (
              <div key={idx} className="text-center">
                <div className="text-5xl mb-4">{value.icon}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{value.title}</h3>
                <p className="text-slate-600 leading-relaxed">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications & Licenses */}
      <section className="py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Licensed & Certified</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Your cargo is handled by certified professionals with proper licenses and industry certifications.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: '📜',
                title: 'PPJK License',
                desc: 'Licensed Customs Broker',
                number: 'No. 123/PPJK/2020'
              },
              {
                icon: '✈️',
                title: 'IATA Certified',
                desc: 'Air Cargo Agent',
                number: 'Code: 12-3-4567'
              },
              {
                icon: '⭐',
                title: 'ISO 9001:2015',
                desc: 'Quality Management',
                number: 'Certified 2021'
              },
              {
                icon: '🏢',
                title: 'GAFEKSI Member',
                desc: 'Freight Forwarder Association',
                number: 'Member Since 2020'
              },
            ].map((cert, idx) => (
              <div key={idx} className="bg-white p-8 rounded-xl border border-slate-200 text-center">
                <div className="text-4xl mb-4">{cert.icon}</div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{cert.title}</h3>
                <p className="text-sm text-slate-600 mb-3">{cert.desc}</p>
                <p className="text-xs text-slate-400 font-mono">{cert.number}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose KargoPath */}
      <section className="py-24 bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Why Choose KargoPath</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              We're not just another freight forwarder. We're your logistics technology partner.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: '15+ Years Experience',
                desc: 'Combined expertise in international freight forwarding and customs brokerage.'
              },
              {
                title: 'Technology First',
                desc: 'Modern platform for instant quotations, real-time tracking, and digital documentation.'
              },
              {
                title: 'Global Network',
                desc: 'Strategic partnerships with 200+ carriers and agents across 50+ countries.'
              },
              {
                title: 'B2B Focused',
                desc: 'Specialized in serving businesses, not retail. We understand corporate logistics needs.'
              },
              {
                title: 'Transparent Pricing',
                desc: 'All charges itemized upfront. No hidden fees or surprise costs.'
              },
              {
                title: 'Fast Response',
                desc: 'Average quotation time: 3 hours. Average support response: 15 minutes.'
              },
            ].map((item, idx) => (
              <div key={idx} className="bg-slate-50 p-8 rounded-xl border border-slate-200">
                <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Work Together?</h2>
          <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto">
            Let's discuss how KargoPath can optimize your logistics operations and reduce your supply chain costs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact" className="px-10 py-4 bg-white text-blue-700 font-bold rounded-2xl shadow-xl hover:-translate-y-1 transition-all inline-block">
              Contact Our Team →
            </Link>
            <Link to="/quote" target="_blank" rel="noopener noreferrer" className="px-10 py-4 bg-transparent border-2 border-white text-white font-bold rounded-2xl hover:bg-white/10 transition-all inline-block">
              Request a Quote
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
