import React, { useState } from 'react';

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', company: '', subject: 'general', message: '' });
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));
  const inputClass = "w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all font-medium text-slate-900";

  const handleSubmit = e => {
    e.preventDefault();
    // TODO: connect to API
    setSent(true);
  };

  return (
    <div className="min-h-screen font-sans bg-white">
      {/* Header */}
      <div className="bg-slate-900 pt-28 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_40%,rgba(59,130,246,0.12),transparent_60%)]" />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-3">Get in Touch</p>
          <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-5">Contact Us</h1>
          <p className="text-slate-400 text-lg font-medium">Have questions? Our team is ready to help you find the right logistics solution.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-5 gap-12">
          {/* Contact info */}
          <div className="md:col-span-2 space-y-8">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 mb-6">Our Office</h2>
              {[
                { icon: '🏢', label: 'Address',  val: 'Sudirman Tower Lt. 15\nJl. Jend. Sudirman Kav. 52-53\nJakarta Selatan 12190' },
                { icon: '📞', label: 'Phone',    val: '+62 21 555 1234' },
                { icon: '📧', label: 'Email',    val: 'sales@kargopath.com' },
                { icon: '🕐', label: 'Hours',    val: 'Mon–Fri: 08:00 – 17:00 WIB\nSat: 09:00 – 13:00 WIB' },
              ].map(({ icon, label, val }) => (
                <div key={label} className="flex gap-4 py-4 border-b border-slate-100 last:border-0">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0 text-lg">{icon}</div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                    <p className="text-slate-700 font-medium text-sm whitespace-pre-line">{val}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
              <p className="text-sm font-bold text-blue-700 mb-2">💬 Need a Quick Quote?</p>
              <p className="text-sm text-blue-600 font-medium mb-4">Skip the form and request a formal quotation directly through our system.</p>
              <a href="/quote" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:-translate-y-0.5 transition-all shadow-md shadow-blue-600/20">
                Request a Quote →
              </a>
            </div>
          </div>

          {/* Form */}
          <div className="md:col-span-3">
            {sent ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-20">
                <div className="text-6xl mb-5">✅</div>
                <h3 className="text-2xl font-extrabold text-slate-900 mb-3">Message Sent!</h3>
                <p className="text-slate-500 font-medium">Our team will get back to you within 1 business day.</p>
                <button onClick={() => setSent(false)} className="mt-6 px-6 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all text-sm">
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Full Name *</label>
                    <input required type="text" value={form.name} onChange={set('name')} placeholder="John Doe" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Email Address *</label>
                    <input required type="email" value={form.email} onChange={set('email')} placeholder="john@company.com" className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Company Name</label>
                  <input type="text" value={form.company} onChange={set('company')} placeholder="PT Logistik Nusantara" className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Subject</label>
                  <select value={form.subject} onChange={set('subject')} className={inputClass + " cursor-pointer"}>
                    <option value="general">General Inquiry</option>
                    <option value="quote">Quotation Request</option>
                    <option value="tracking">Tracking Issue</option>
                    <option value="complaint">Complaint</option>
                    <option value="partnership">Partnership</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Message *</label>
                  <textarea required value={form.message} onChange={set('message')}
                    placeholder="Tell us how we can help you..."
                    className={inputClass + " h-36 resize-none"} />
                </div>
                <button type="submit"
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 text-lg">
                  Send Message →
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
