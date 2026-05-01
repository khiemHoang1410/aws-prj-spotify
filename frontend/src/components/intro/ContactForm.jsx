import { useState } from 'react';

const INPUT_CLASS =
  'w-full bg-[#111] border border-[#333] rounded-lg px-4 py-3 text-white placeholder-[#666] focus:outline-none focus:border-[#c5e054] transition text-sm';

export default function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState(null); // null | 'sending' | 'success' | 'error'

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return;
    setStatus('sending');
    try {
      // Giả lập gửi form — thay bằng API call thực nếu có
      await new Promise((res) => setTimeout(res, 1200));
      setStatus('success');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch {
      setStatus('error');
    }
  };

  return (
    <section id="contact" className="py-20 px-4">
      <div className="container" style={{ maxWidth: '700px', margin: '0 auto' }}>
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-primary)' }}>
            Liên hệ
          </p>
          <h2 className="text-4xl font-extrabold text-white mb-4">Gửi tin nhắn cho chúng tôi</h2>
          <p className="text-[#aaa] text-sm">
            Có câu hỏi, góp ý hoặc hợp tác? Điền vào form bên dưới — chúng tôi sẽ phản hồi sớm nhất có thể.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 bg-[#0d0d0d] border border-[#222] rounded-2xl p-8"
        >
          {/* Name + Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[#aaa] font-semibold uppercase tracking-wider">Tên *</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Nguyễn Văn A"
                required
                className={INPUT_CLASS}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[#aaa] font-semibold uppercase tracking-wider">Email *</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="example@email.com"
                required
                className={INPUT_CLASS}
              />
            </div>
          </div>

          {/* Subject */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#aaa] font-semibold uppercase tracking-wider">Tiêu đề</label>
            <input
              name="subject"
              value={form.subject}
              onChange={handleChange}
              placeholder="Chủ đề bạn muốn hỏi..."
              className={INPUT_CLASS}
            />
          </div>

          {/* Message */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#aaa] font-semibold uppercase tracking-wider">Nội dung *</label>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              placeholder="Nội dung tin nhắn..."
              required
              rows={5}
              className={`${INPUT_CLASS} resize-none`}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={status === 'sending'}
            className="mt-2 w-full py-3 rounded-full font-bold text-sm uppercase tracking-widest transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--color-primary)', color: '#000' }}
          >
            {status === 'sending' ? 'Đang gửi...' : 'Gửi tin nhắn'}
          </button>

          {/* Feedback */}
          {status === 'success' && (
            <p className="text-center text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>
              ✓ Tin nhắn đã được gửi thành công! Chúng tôi sẽ liên hệ lại sớm.
            </p>
          )}
          {status === 'error' && (
            <p className="text-center text-sm text-red-400 font-semibold">
              Gửi thất bại. Vui lòng thử lại sau.
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
