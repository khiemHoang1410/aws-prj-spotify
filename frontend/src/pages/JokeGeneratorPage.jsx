import { useState, useCallback } from 'react';
import { Laugh, RefreshCw, Copy, CheckCheck, Globe } from 'lucide-react';

const JOKE_API_URL = 'https://v2.jokeapi.dev/joke/Any?safe-mode';
const JOKE_API_VN_URL = 'https://v2.jokeapi.dev/joke/Any?safe-mode&lang=cs'; // fallback: tiếng Anh khi không có VN

// Bộ câu đùa tiếng Việt tích hợp sẵn (dự phòng)
const VIETNAMESE_JOKES = [
  {
    type: 'single',
    joke: 'Tại sao lập trình viên không thích ra ngoài? Vì ngoài trời không có wi-fi!',
  },
  {
    type: 'twopart',
    setup: 'Tại sao con mèo lại gõ bàn phím?',
    delivery: 'Vì nó muốn gửi "meo" cho bạn!',
  },
  {
    type: 'single',
    joke: 'Học lập trình cũng như học nấu ăn: bắt đầu theo công thức, nhưng cuối cùng vẫn cháy nồi!',
  },
  {
    type: 'twopart',
    setup: 'Tại sao bug lại khó tìm hơn chìa khóa?',
    delivery: 'Vì ít nhất chìa khóa không tự di chuyển sau mỗi lần bạn nhìn đi chỗ khác!',
  },
  {
    type: 'single',
    joke: 'Có hai loại lập trình viên: người viết comments và người nghĩ code tự giải thích được!',
  },
  {
    type: 'twopart',
    setup: 'Deadline là gì?',
    delivery: 'Là đường kẻ mà sau khi vượt qua, dự án của bạn mới thực sự... bắt đầu!',
  },
  {
    type: 'single',
    joke: '"Code của tôi chạy trên máy tôi" — câu nói bất hủ của mọi developer trước buổi demo!',
  },
  {
    type: 'twopart',
    setup: 'Sự khác biệt giữa junior và senior developer là gì?',
    delivery: 'Senior biết tìm câu trả lời trên Stack Overflow nhanh hơn!',
  },
  {
    type: 'single',
    joke: 'Tại sao máy tính lại tốt ở toán? Vì nó biết nhị phân — không 1 thì 0, không có chuyện "khoảng giữa"!',
  },
  {
    type: 'twopart',
    setup: 'Tại sao không nên kể câu đùa về UDP?',
    delivery: 'Tôi đã kể rồi đó, bạn có nhận được không?',
  },
];

const LANG = {
  vi: {
    title: 'Máy Tạo Câu Đùa',
    subtitle: 'Nhấn nút để lấy một câu đùa ngẫu nhiên!',
    btnNew: 'Câu đùa mới',
    btnLoading: 'Đang tải...',
    copyBtn: 'Sao chép',
    copiedBtn: 'Đã sao chép!',
    langLabel: 'Tiếng Việt',
    errorMsg: 'Không thể lấy câu đùa, đang dùng bộ câu đùa offline!',
    punchline: 'Câu trả lời:',
    counter: (n) => `Đã xem ${n} câu đùa`,
  },
  en: {
    title: 'Joke Generator',
    subtitle: 'Click the button to get a random joke!',
    btnNew: 'New Joke',
    btnLoading: 'Loading...',
    copyBtn: 'Copy',
    copiedBtn: 'Copied!',
    langLabel: 'English',
    errorMsg: 'Could not fetch a joke, using offline jokes!',
    punchline: 'Punchline:',
    counter: (n) => `${n} joke${n === 1 ? '' : 's'} seen`,
  },
};

export default function JokeGeneratorPage() {
  const [joke, setJoke] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [lang, setLang] = useState('vi');
  const [count, setCount] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const t = LANG[lang];

  const getRandomVnJoke = () =>
    VIETNAMESE_JOKES[Math.floor(Math.random() * VIETNAMESE_JOKES.length)];

  const fetchJoke = useCallback(async () => {
    setLoading(true);
    setError('');
    setRevealed(false);
    setCopied(false);

    if (lang === 'vi') {
      // Dùng bộ câu đùa tiếng Việt tích hợp sẵn
      await new Promise((r) => setTimeout(r, 400)); // giả lập network delay
      setJoke(getRandomVnJoke());
      setCount((c) => c + 1);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(JOKE_API_URL);
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setJoke(data);
      setCount((c) => c + 1);
    } catch {
      setError(t.errorMsg);
      setJoke(getRandomVnJoke());
      setCount((c) => c + 1);
    } finally {
      setLoading(false);
    }
  }, [lang, t.errorMsg]);

  const getJokeText = () => {
    if (!joke) return '';
    if (joke.type === 'single') return joke.joke;
    return `${joke.setup}\n${t.punchline} ${joke.delivery}`;
  };

  const handleCopy = async () => {
    const text = getJokeText();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard không khả dụng
    }
  };

  return (
    <div className="min-h-full flex flex-col items-center justify-start py-12 px-4">
      {/* Header */}
      <div className="flex flex-col items-center gap-3 mb-10">
        <div className="bg-green-500/20 p-4 rounded-full">
          <Laugh size={40} className="text-green-400" />
        </div>
        <h1 className="text-3xl font-bold text-white">{t.title}</h1>
        <p className="text-neutral-400 text-sm">{t.subtitle}</p>
        {count > 0 && (
          <span className="text-xs text-neutral-500">{t.counter(count)}</span>
        )}
      </div>

      {/* Language toggle */}
      <div className="flex bg-neutral-800 rounded-full p-1 mb-8 gap-1">
        {(['vi', 'en']).map((l) => (
          <button
            key={l}
            onClick={() => { setLang(l); setJoke(null); setError(''); }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition ${
              lang === l ? 'bg-green-500 text-black' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Globe size={14} />
            {LANG[l].langLabel}
          </button>
        ))}
      </div>

      {/* Joke card */}
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-700 rounded-2xl p-6 mb-6 min-h-[180px] flex flex-col justify-center">
        {!joke && !loading && (
          <p className="text-neutral-500 text-center text-sm">
            {lang === 'vi' ? 'Nhấn "Câu đùa mới" để bắt đầu 😄' : 'Press "New Joke" to start 😄'}
          </p>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-2 text-neutral-400">
            <RefreshCw size={18} className="animate-spin" />
            <span className="text-sm">{t.btnLoading}</span>
          </div>
        )}

        {!loading && joke && (
          <div className="space-y-4">
            {joke.type === 'single' ? (
              <p className="text-white text-base leading-relaxed text-center">{joke.joke}</p>
            ) : (
              <>
                <p className="text-white text-base leading-relaxed text-center">{joke.setup}</p>
                <div className="h-px bg-neutral-700" />
                {revealed ? (
                  <p className="text-green-400 text-base leading-relaxed text-center font-medium">
                    {joke.delivery}
                  </p>
                ) : (
                  <button
                    onClick={() => setRevealed(true)}
                    className="w-full py-2 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 text-sm transition"
                  >
                    {lang === 'vi' ? 'Xem câu trả lời 🤔' : 'Reveal punchline 🤔'}
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Error notice */}
      {error && (
        <p className="text-yellow-400 text-xs mb-4 text-center">{error}</p>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={fetchJoke}
          disabled={loading}
          className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-black font-bold px-6 py-3 rounded-full transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          {loading ? t.btnLoading : t.btnNew}
        </button>

        {joke && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold px-5 py-3 rounded-full transition border border-neutral-600"
          >
            {copied ? <CheckCheck size={16} className="text-green-400" /> : <Copy size={16} />}
            {copied ? t.copiedBtn : t.copyBtn}
          </button>
        )}
      </div>
    </div>
  );
}
