import { Instagram, Twitter, Facebook } from 'lucide-react';

const LINKS = [
  {
    heading: 'Công ty',
    items: ['Giới thiệu', 'Tuyển dụng', 'For the Record'],
  },
  {
    heading: 'Cộng đồng',
    items: ['Dành cho nghệ sĩ', 'Nhà phát triển', 'Quảng cáo', 'Nhà đầu tư', 'Nhà cung cấp'],
  },
  {
    heading: 'Liên kết hữu ích',
    items: ['Hỗ trợ', 'Ứng dụng miễn phí', 'Phổ biến theo quốc gia', 'Nhập nhạc của bạn'],
  },
  {
    heading: 'Gói dịch vụ',
    items: ['Premium Cá nhân', 'Premium Sinh viên', 'Miễn phí'],
  },
];

const LEGAL_LINKS = ['Pháp lý', 'Trung tâm An toàn & Quyền riêng tư', 'Chính sách bảo mật', 'Cookie', 'Giới thiệu về quảng cáo', 'Trợ năng'];

export default function PageFooter() {
  return (
    <footer className="bg-[#121212] border-t border-[#282828] mt-8 px-6 pt-10 pb-6 text-sm">
      {/* Top: columns + social */}
      <div className="flex flex-col lg:flex-row justify-between gap-8 pb-8 border-b border-[#282828]">
        {/* Link columns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 flex-1">
          {LINKS.map(({ heading, items }) => (
            <div key={heading}>
              <h4 className="text-white font-bold mb-3 text-xs tracking-wider uppercase">{heading}</h4>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-[#b3b3b3] hover:text-white transition-colors"
                      onClick={(e) => e.preventDefault()}
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Social icons */}
        <div className="flex lg:flex-col items-start gap-3 lg:items-end">
          <div className="flex gap-3">
            {[
              { Icon: Instagram, label: 'Instagram' },
              { Icon: Twitter, label: 'Twitter' },
              { Icon: Facebook, label: 'Facebook' },
            ].map(({ Icon, label }) => (
              <a
                key={label}
                href="#"
                aria-label={label}
                onClick={(e) => e.preventDefault()}
                className="w-10 h-10 flex items-center justify-center bg-[#282828] hover:bg-[#3e3e3e] rounded-full text-white transition-colors"
              >
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom: legal + copyright */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6">
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {LEGAL_LINKS.map((link) => (
            <a
              key={link}
              href="#"
              className="text-[#b3b3b3] hover:text-white transition-colors text-xs"
              onClick={(e) => e.preventDefault()}
            >
              {link}
            </a>
          ))}
        </div>
        <p className="text-[#b3b3b3] text-xs whitespace-nowrap">© 2026 SoundWave</p>
      </div>
    </footer>
  );
}
