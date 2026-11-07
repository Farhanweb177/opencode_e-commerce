"use client";

import { useState } from "react";
import {
  SITE_WHATSAPP_DISPLAY,
  buildWhatsAppLink,
} from "@/lib/site";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const subject = encodeURIComponent(
      `All in One Contact: ${form.name}`
    );
    const body = encodeURIComponent(
      `${form.message}\n\n— ${form.name} (${form.email})`
    );
    window.location.href = `mailto:support@allinone.pk?subject=${subject}&body=${body}`;
    setSent(true);
  }

  return (
    <section className="container section static-page">
      <h1 className="page-title">Contact Us</h1>
      <div className="static-content">
        <p>
          Kisi bhi sawal, order ya complaint ke liye humse rabta karein. Hamari
          team 24 ghante ke andar jawab deti hai.
        </p>
        <p>
          📞 Phone / WhatsApp:{" "}
          <a href={buildWhatsAppLink("Assalam o Alaikum! Mujhe aapki store ke baare mein poochna hai.")}>
            {SITE_WHATSAPP_DISPLAY}
          </a>
          <br />✉️ Email:{" "}
          <a href="mailto:support@allinone.pk">support@allinone.pk</a>
          <br />🕐 Timing: Mon – Sat, 9 AM to 9 PM
        </p>

        <h2>Message Bhejein</h2>
        {sent ? (
          <div className="quick-order-success">
            <span className="quick-order-success-emoji">✅</span>
            <strong>Shukriya!</strong>
            <p>
              Aapka message email client mein khul gaya. Agar mail app nahi
              khuli to seedha support@allinone.pk par email karein.
            </p>
          </div>
        ) : (
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="contact-name">Name *</label>
              <input
                id="contact-name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="contact-email">Email *</label>
              <input
                id="contact-email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="contact-message">Message *</label>
              <textarea
                id="contact-message"
                name="message"
                rows={5}
                value={form.message}
                onChange={handleChange}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={!form.name || !form.email || !form.message}
            >
              Send Message
            </button>
          </form>
        )}
      </div>
    </section>
  );
}