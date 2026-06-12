/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { db } from '../lib/db';
import { Mail, Send, Compass, ShieldCheck, HelpCircle, FileText } from 'lucide-react';

export const Contact: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  // Validations & Response states
  const [errors, setErrors] = useState<{ name?: string; email?: string; subject?: string; message?: string }>({});
  const [submitStatus, setSubmitStatus] = useState<{ success?: boolean; text?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const tempErrors: typeof errors = {};
    let isValid = true;

    if (!name.trim()) {
      tempErrors.name = 'Please declare your name.';
      isValid = false;
    }

    if (!email.trim()) {
      tempErrors.email = 'Please provide an email address for correspondence.';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      tempErrors.email = 'Please enter a valid structure (e.g., reader@domain.com).';
      isValid = false;
    }

    if (!subject.trim()) {
      tempErrors.subject = 'A letter subject is required.';
      isValid = false;
    }

    if (!message.trim()) {
      tempErrors.message = 'Please type your coordinates or message.';
      isValid = false;
    } else if (message.trim().length < 15) {
      tempErrors.message = 'Message must be at least 15 characters to establish objective contact.';
      isValid = false;
    }

    setErrors(tempErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus(null);
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      const res = await db.contact.submit({
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim()
      });

      setSubmitStatus({ success: true, text: res.message });
      
      // Clear values on success
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      setErrors({});
    } catch (err) {
      setSubmitStatus({ success: false, text: 'Correspondence log failed. Try checking local storage permissions!' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12">
      
      {/* 1. Header display */}
      <div className="space-y-4 text-center max-w-2xl mx-auto">
        <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-ink dark:text-sand animate-enter">
          The Scribe's Registry
        </h1>
        <p className="text-sm sm:text-base text-charcoal/70 dark:text-sand/75 font-serif leading-relaxed italic max-w-xl mx-auto">
          "A letter is a quiet visitation we compose at our leisure and send in faith." 
          Share observations, enquire on publications, or register with the Guild.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Left Side: Policy & Guidelines */}
        <div className="lg:col-span-5 space-y-8">
          
          <div className="bg-white/45 dark:bg-earth-card/45 border border-white/60 dark:border-white/5 rounded-2xl p-6 sm:p-8 space-y-6 backdrop-blur-sm">
            <h3 className="font-display text-xl font-semibold text-ink dark:text-sand flex items-center space-x-2">
              <FileText className="w-5 h-5 text-sage dark:text-linen" />
              <span>Correspondence Protocol</span>
            </h3>

            <p className="text-xs sm:text-sm text-charcoal/70 dark:text-sand/70 font-serif leading-relaxed">
              To support fine editing and protect our focus, the editorial committee reads collective 
              letters every Tuesday and Friday morning.
            </p>

            <ul className="space-y-4 text-xs sm:text-sm text-charcoal/80 dark:text-sand/80 font-serif">
              <li className="flex items-start space-x-3.5">
                <span className="w-5 h-5 bg-sage/10 text-sage dark:bg-linen/15 dark:text-linen text-[10px] font-mono font-extrabold rounded-full flex items-center justify-center shrink-0">
                  01
                </span>
                <span>
                  <strong>Critiques:</strong> Sincere feedback regarding particular published verse lines or translations gets forwarded directly to the respective authors.
                </span>
              </li>
              <li className="flex items-start space-x-3.5">
                <span className="w-5 h-5 bg-sage/10 text-sage dark:bg-linen/15 dark:text-linen text-[10px] font-mono font-extrabold rounded-full flex items-center justify-center shrink-0">
                  02
                </span>
                <span>
                  <strong>Anthology Calls:</strong> Unsolicited submissions are momentarily closed. Any changes to manuscript collection portals will be broadcasted in the Friday verse ledger.
                </span>
              </li>
              <li className="flex items-start space-x-3.5">
                <span className="w-5 h-5 bg-sage/10 text-sage dark:bg-linen/15 dark:text-linen text-[10px] font-mono font-extrabold rounded-full flex items-center justify-center shrink-0">
                  03
                </span>
                <span>
                  <strong>Newsletter:</strong> For immediate updates, we recommend registering via the newsletter signup on our home page.
                </span>
              </li>
            </ul>
          </div>

          {/* Core Info */}
          <div className="p-6 border border-white/60 dark:border-white/5 rounded-xl flex items-center space-x-4 bg-white/45 dark:bg-earth-card/45 backdrop-blur-sm">
            <div className="p-3 bg-sage/10 dark:bg-linen/10 rounded-lg text-sage dark:text-linen">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-mono font-bold uppercase text-charcoal/40 dark:text-sand/40 tracking-wider">Direct Mailbox</p>
              <p className="text-sm font-semibold text-[#5A5A40] dark:text-[#D9D1C5]">curator@inkandechoes.com</p>
            </div>
          </div>
        </div>

        {/* Right Side: Professional Contact Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 bg-white/55 dark:bg-[#2B2927]/60 border border-white/60 dark:border-white/10 rounded-2xl p-6 sm:p-10 shadow-sm space-y-6 animate-enter backdrop-blur-md">
          
          <div className="space-y-4">
            {/* Name Input */}
            <div>
              <label htmlFor="contact-name" className="block text-xs font-mono font-bold tracking-wide uppercase text-[#5A5A40] dark:text-linen mb-1.5">
                Your Name
              </label>
              <input
                type="text"
                id="contact-name"
                placeholder="Declare your identity (e.g. Liam Sterling)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-4 py-3 bg-white/40 dark:bg-stone-950/40 text-ink dark:text-sand border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-sage focus:border-sage transition-all ${
                  errors.name ? 'border-rose-400 focus:ring-rose-400' : 'border-charcoal/10 dark:border-white/5'
                }`}
              />
              {errors.name && <p className="text-[11px] text-rose-500 mt-1 font-serif">{errors.name}</p>}
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="contact-email" className="block text-xs font-mono font-bold tracking-wide uppercase text-[#5A5A40] dark:text-linen mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                id="contact-email"
                placeholder="For correspondence (e.g. reader@domain.com)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-3 bg-white/40 dark:bg-stone-950/40 text-ink dark:text-sand border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-sage focus:border-sage transition-all ${
                  errors.email ? 'border-rose-400 focus:ring-rose-400' : 'border-charcoal/10 dark:border-white/5'
                }`}
              />
              {errors.email && <p className="text-[11px] text-rose-500 mt-1 font-serif">{errors.email}</p>}
            </div>

            {/* Subject Input */}
            <div>
              <label htmlFor="contact-subject" className="block text-xs font-mono font-bold tracking-wide uppercase text-[#5A5A40] dark:text-linen mb-1.5">
                Subject
              </label>
              <input
                type="text"
                id="contact-subject"
                placeholder="Topic of writing (e.g. Translation Critique)"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className={`w-full px-4 py-3 bg-white/40 dark:bg-stone-950/40 text-ink dark:text-sand border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-sage focus:border-sage transition-all ${
                  errors.subject ? 'border-rose-400 focus:ring-rose-400' : 'border-charcoal/10 dark:border-white/5'
                }`}
              />
              {errors.subject && <p className="text-[11px] text-rose-500 mt-1 font-serif">{errors.subject}</p>}
            </div>

            {/* Message Textarea */}
            <div>
              <label htmlFor="contact-message" className="block text-xs font-mono font-bold tracking-wide uppercase text-[#5A5A40] dark:text-linen mb-1.5">
                Correspondence Message
              </label>
              <textarea
                id="contact-message"
                rows={5}
                placeholder="Compose your thoughts meticulously here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className={`w-full px-4 py-3 bg-white/40 dark:bg-stone-950/40 text-ink dark:text-sand border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-sage focus:border-sage transition-all resize-none font-serif ${
                  errors.message ? 'border-rose-400 focus:ring-rose-400' : 'border-charcoal/10 dark:border-white/5'
                }`}
              />
              {errors.message && <p className="text-[11px] text-rose-500 mt-1 font-serif">{errors.message}</p>}
            </div>
          </div>

          {/* Form Action submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-sage hover:bg-[#494933] text-sand dark:bg-[#D9D1C5] dark:hover:bg-sand dark:text-ink font-semibold rounded-xl text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-sm active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center space-x-2">
                <HelpCircle className="w-4 h-4 animate-spin" />
                <span>Publishing message...</span>
              </span>
            ) : (
              <span className="flex items-center space-x-2">
                <Send className="w-4 h-4" />
                <span>Verify &amp; Despatch Letter</span>
              </span>
            )}
          </button>

          {/* Output feedback response */}
          {submitStatus && (
            <div className="p-4 bg-white/40 dark:bg-stone-950/40 border border-charcoal/10 dark:border-white/5 rounded-xl animate-enter">
              {submitStatus.success ? (
                <p className="text-xs text-charcoal/85 dark:text-[#F1EFEA]/85 flex items-start">
                  <ShieldCheck className="w-4 h-4 mr-2 text-sage shrink-0" />
                  <span>{submitStatus.text}</span>
                </p>
              ) : (
                <p className="text-xs text-rose-500">
                  {submitStatus.text}
                </p>
              )}
            </div>
          )}

        </form>

      </div>

    </div>
  );
};
