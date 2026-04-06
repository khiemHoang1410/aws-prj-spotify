import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, CheckCircle2, Circle, ListTodo, Edit3, X, Check } from 'lucide-react';

const STORAGE_KEY = 'spotify-app-todos';

const PRIORITY = {
  low: { label: 'Thấp', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  medium: { label: 'Trung bình', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  high: { label: 'Cao', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

const FILTER = {
  all: 'Tất cả',
  active: 'Đang làm',
  completed: 'Hoàn thành',
};

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(todos) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch {
    // localStorage không khả dụng
  }
}

let nextId = Date.now();
const genId = () => String(++nextId);

export default function TodoListPage() {
  const [todos, setTodos] = useState(() => loadFromStorage());
  const [inputText, setInputText] = useState('');
  const [inputPriority, setInputPriority] = useState('medium');
  const [filter, setFilter] = useState('all');
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState('');

  // Lưu vào local storage mỗi khi todos thay đổi
  useEffect(() => {
    saveToStorage(todos);
  }, [todos]);

  const addTodo = useCallback(() => {
    const text = inputText.trim();
    if (!text) return;
    const newTodo = {
      id: genId(),
      text,
      priority: inputPriority,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setTodos((prev) => [newTodo, ...prev]);
    setInputText('');
  }, [inputText, inputPriority]);

  const toggleTodo = (id) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const deleteTodo = (id) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const startEdit = (todo) => {
    setEditId(todo.id);
    setEditText(todo.text);
  };

  const saveEdit = () => {
    const text = editText.trim();
    if (!text) { cancelEdit(); return; }
    setTodos((prev) =>
      prev.map((t) => (t.id === editId ? { ...t, text } : t))
    );
    cancelEdit();
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditText('');
  };

  const clearCompleted = () => {
    setTodos((prev) => prev.filter((t) => !t.completed));
  };

  const filtered = todos.filter((t) => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const completedCount = todos.filter((t) => t.completed).length;
  const activeCount = todos.length - completedCount;

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      {/* Header */}
      <div className="flex flex-col items-center gap-3 mb-10">
        <div className="bg-green-500/20 p-4 rounded-full">
          <ListTodo size={40} className="text-green-400" />
        </div>
        <h1 className="text-3xl font-bold text-white">Danh Sách Việc Cần Làm</h1>
        <p className="text-neutral-400 text-sm">Dữ liệu được lưu tự động vào trình duyệt</p>
        <div className="flex gap-4 text-xs text-neutral-500">
          <span>{todos.length} tổng cộng</span>
          <span className="text-green-400">{activeCount} đang làm</span>
          <span className="text-neutral-400 line-through">{completedCount} hoàn thành</span>
        </div>
      </div>

      {/* Input area */}
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-4 mb-4 space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTodo()}
            placeholder="Thêm việc cần làm..."
            className="flex-1 bg-neutral-800 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-green-500 placeholder-neutral-500"
          />
          <button
            onClick={addTodo}
            disabled={!inputText.trim()}
            className="flex items-center gap-1.5 bg-green-500 hover:bg-green-400 text-black font-bold px-4 py-2.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            <Plus size={16} />
            Thêm
          </button>
        </div>

        {/* Priority selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500">Mức độ ưu tiên:</span>
          {Object.entries(PRIORITY).map(([key, { label, color }]) => (
            <button
              key={key}
              onClick={() => setInputPriority(key)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                inputPriority === key
                  ? color
                  : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:border-neutral-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-neutral-900 rounded-xl p-1 mb-4 border border-neutral-700">
        {Object.entries(FILTER).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${
              filter === key
                ? 'bg-green-500 text-black'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            {label}
            {key === 'active' && activeCount > 0 && (
              <span className="ml-1.5 bg-green-600 text-white text-xs px-1.5 rounded-full">{activeCount}</span>
            )}
            {key === 'completed' && completedCount > 0 && (
              <span className="ml-1.5 bg-neutral-700 text-neutral-300 text-xs px-1.5 rounded-full">{completedCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Todo list */}
      <div className="space-y-2 mb-4">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-neutral-500 text-sm">
            {filter === 'completed'
              ? 'Chưa có việc nào hoàn thành'
              : filter === 'active'
              ? 'Không có việc đang làm'
              : 'Chưa có việc nào. Hãy thêm một việc!'}
          </div>
        )}

        {filtered.map((todo) => (
          <div
            key={todo.id}
            className={`flex items-center gap-3 bg-neutral-900 border rounded-xl px-4 py-3 transition group ${
              todo.completed ? 'border-neutral-800 opacity-60' : 'border-neutral-700 hover:border-neutral-600'
            }`}
          >
            {/* Complete toggle */}
            <button
              onClick={() => toggleTodo(todo.id)}
              className="flex-shrink-0 text-neutral-400 hover:text-green-400 transition"
            >
              {todo.completed ? (
                <CheckCircle2 size={20} className="text-green-500" />
              ) : (
                <Circle size={20} />
              )}
            </button>

            {/* Text / Edit */}
            <div className="flex-1 min-w-0">
              {editId === todo.id ? (
                <input
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEdit();
                    if (e.key === 'Escape') cancelEdit();
                  }}
                  className="w-full bg-neutral-800 text-white text-sm rounded px-2 py-1 outline-none focus:ring-1 focus:ring-green-500"
                  autoFocus
                />
              ) : (
                <p
                  className={`text-sm truncate ${
                    todo.completed ? 'line-through text-neutral-500' : 'text-white'
                  }`}
                >
                  {todo.text}
                </p>
              )}
            </div>

            {/* Priority badge */}
            <span
              className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${PRIORITY[todo.priority]?.color || ''}`}
            >
              {PRIORITY[todo.priority]?.label}
            </span>

            {/* Action buttons */}
            <div className="flex gap-1 flex-shrink-0">
              {editId === todo.id ? (
                <>
                  <button onClick={saveEdit} className="p-1.5 text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-lg transition">
                    <Check size={14} />
                  </button>
                  <button onClick={cancelEdit} className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded-lg transition">
                    <X size={14} />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => startEdit(todo)}
                    className="p-1.5 text-neutral-500 hover:text-white hover:bg-neutral-700 rounded-lg transition opacity-0 group-hover:opacity-100"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Clear completed */}
      {completedCount > 0 && (
        <div className="flex justify-end">
          <button
            onClick={clearCompleted}
            className="text-xs text-neutral-500 hover:text-red-400 transition flex items-center gap-1"
          >
            <Trash2 size={12} />
            Xoá {completedCount} mục đã hoàn thành
          </button>
        </div>
      )}
    </div>
  );
}
