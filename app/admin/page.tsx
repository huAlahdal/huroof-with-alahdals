"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Question,
  GAME_LETTERS,
  CATEGORIES,
  DEFAULT_QUESTIONS,
  loadCustomQuestions,
  saveCustomQuestions,
  generateId,
} from "@/lib/questions";

const EMPTY_FORM: Omit<Question, "id"> = {
  letter: "أ",
  question: "",
  answer: "",
  category: "عام",
  difficulty: "easy",
};

export default function AdminPage() {
  const router = useRouter();
  const [customQuestions, setCustomQuestions] = useState<Question[]>([]);
  const [filterLetter, setFilterLetter] = useState<string>("all");
  const [showBuiltIn, setShowBuiltIn] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Question, "id">>({ ...EMPTY_FORM });
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setCustomQuestions(loadCustomQuestions());
  }, []);

  const allQuestions: Question[] = [
    ...(showBuiltIn ? DEFAULT_QUESTIONS : []),
    ...customQuestions,
  ];

  const filtered = allQuestions.filter((q) => {
    const matchLetter = filterLetter === "all" || q.letter === filterLetter;
    const matchSearch =
      !search ||
      q.question.includes(search) ||
      q.answer.includes(search);
    return matchLetter && matchSearch;
  });

  const saveAll = useCallback((questions: Question[]) => {
    saveCustomQuestions(questions);
    setCustomQuestions(questions);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, []);

  function handleSubmit() {
    if (!form.question.trim() || !form.answer.trim()) return;

    let updated: Question[];
    if (editingId) {
      updated = customQuestions.map((q) =>
        q.id === editingId ? { ...form, id: editingId } : q
      );
    } else {
      updated = [...customQuestions, { ...form, id: generateId() }];
    }
    saveAll(updated);
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setShowForm(false);
  }

  function handleEdit(q: Question) {
    if (DEFAULT_QUESTIONS.find((dq) => dq.id === q.id)) return; // can't edit built-in
    setForm({ letter: q.letter, question: q.question, answer: q.answer, category: q.category, difficulty: q.difficulty });
    setEditingId(q.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleDelete(id: string) {
    if (DEFAULT_QUESTIONS.find((dq) => dq.id === id)) return;
    saveAll(customQuestions.filter((q) => q.id !== id));
  }

  const difficultyLabel = { easy: "سهل", medium: "متوسط", hard: "صعب" };
  const difficultyColor = { easy: "text-green-400", medium: "text-yellow-400", hard: "text-red-400" };

  return (
    <div className="game-bg min-h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 sticky top-0 z-30 backdrop-blur-md" style={{ background: "rgba(15,10,30,0.85)" }}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-colors text-lg"
          >
            ←
          </button>
          <h1 className="text-white font-black text-xl">✏️ إدارة الأسئلة</h1>
        </div>

        <div className="flex items-center gap-2">
          {saved && (
            <motion.span
              className="text-green-400 text-sm font-semibold"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              ✓ تم الحفظ
            </motion.span>
          )}
          <motion.button
            className="px-4 py-2 rounded-xl font-bold text-white text-sm"
            style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { setForm({ ...EMPTY_FORM }); setEditingId(null); setShowForm(true); }}
          >
            + إضافة سؤال
          </motion.button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Add / Edit form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              className="glass-card p-6"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-white font-black text-lg mb-4">
                {editingId ? "✏️ تعديل السؤال" : "➕ إضافة سؤال جديد"}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                {/* Letter select */}
                <div>
                  <label className="text-purple-300 text-xs font-semibold block mb-1">الحرف</label>
                  <select
                    value={form.letter}
                    onChange={(e) => setForm({ ...form, letter: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white font-bold outline-none"
                  >
                    {GAME_LETTERS.map((l) => (
                      <option key={l} value={l} className="bg-gray-900">{l}</option>
                    ))}
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="text-purple-300 text-xs font-semibold block mb-1">التصنيف</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c} className="bg-gray-900">{c}</option>
                    ))}
                  </select>
                </div>

                {/* Difficulty */}
                <div>
                  <label className="text-purple-300 text-xs font-semibold block mb-1">الصعوبة</label>
                  <div className="flex gap-2">
                    {(["easy", "medium", "hard"] as const).map((d) => (
                      <button
                        key={d}
                        onClick={() => setForm({ ...form, difficulty: d })}
                        className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                          form.difficulty === d
                            ? d === "easy" ? "bg-green-700 text-white" : d === "medium" ? "bg-yellow-700 text-white" : "bg-red-700 text-white"
                            : "bg-white/5 text-white/50 hover:bg-white/10"
                        }`}
                      >
                        {difficultyLabel[d]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Question text */}
              <div className="mb-4">
                <label className="text-purple-300 text-xs font-semibold block mb-1">نص السؤال</label>
                <textarea
                  value={form.question}
                  onChange={(e) => setForm({ ...form, question: e.target.value })}
                  rows={3}
                  placeholder="اكتب السؤال هنا..."
                  className="w-full bg-white/5 border border-white/10 focus:border-purple-500 rounded-xl px-4 py-3 text-white placeholder:text-white/30 outline-none resize-none text-right leading-relaxed"
                />
              </div>

              {/* Answer */}
              <div className="mb-5">
                <label className="text-purple-300 text-xs font-semibold block mb-1">الإجابة (تبدأ بالحرف «{form.letter}»)</label>
                <input
                  type="text"
                  value={form.answer}
                  onChange={(e) => setForm({ ...form, answer: e.target.value })}
                  placeholder={`الإجابة تبدأ بـ ${form.letter}...`}
                  className="w-full bg-white/5 border border-white/10 focus:border-purple-500 rounded-xl px-4 py-3 text-white font-bold placeholder:text-white/30 outline-none text-right"
                />
              </div>

              <div className="flex gap-3">
                <motion.button
                  className="flex-1 py-3 rounded-xl font-black text-white"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSubmit}
                  disabled={!form.question.trim() || !form.answer.trim()}
                >
                  {editingId ? "💾 حفظ التعديل" : "➕ إضافة"}
                </motion.button>
                <button
                  className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 font-semibold transition-colors"
                  onClick={() => { setShowForm(false); setEditingId(null); setForm({ ...EMPTY_FORM }); }}
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters */}
        <div className="glass-card p-4 space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث في الأسئلة..."
              className="flex-1 min-w-[200px] bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder:text-white/30 outline-none text-right"
            />
            <label className="flex items-center gap-2 text-white/60 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showBuiltIn}
                onChange={(e) => setShowBuiltIn(e.target.checked)}
                className="accent-purple-500 w-4 h-4"
              />
              إظهار الأسئلة المدمجة
            </label>
          </div>

          {/* Letter filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterLetter("all")}
              className={`px-3 py-1 rounded-full text-sm font-bold transition-all ${filterLetter === "all" ? "bg-purple-600 text-white" : "bg-white/5 text-white/50 hover:bg-white/10"}`}
            >
              الكل ({allQuestions.length})
            </button>
            {GAME_LETTERS.map((l) => {
              const count = allQuestions.filter((q) => q.letter === l).length;
              return (
                <button
                  key={l}
                  onClick={() => setFilterLetter(l)}
                  className={`px-3 py-1 rounded-full text-sm font-bold transition-all ${filterLetter === l ? "bg-purple-600 text-white" : count === 0 ? "bg-white/3 text-white/20" : "bg-white/5 text-white/60 hover:bg-white/10"}`}
                >
                  {l} {count > 0 && <span className="text-xs opacity-70">({count})</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Questions list */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="glass-card p-8 text-center text-white/40">
              لا توجد أسئلة بهذه الفلاتر
            </div>
          )}
          {filtered.map((q) => {
            const isBuiltIn = DEFAULT_QUESTIONS.some((dq) => dq.id === q.id);
            return (
              <motion.div
                key={q.id}
                className="glass-card p-4 flex gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                layout
              >
                {/* Letter badge */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-lg flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
                >
                  {q.letter}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm leading-relaxed mb-1">{q.question}</p>
                  <p className="text-purple-300 text-xs font-semibold">الإجابة: {q.answer}</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <span className="px-2 py-0.5 bg-white/5 text-white/50 rounded-full text-xs">{q.category}</span>
                    <span className={`text-xs font-semibold ${difficultyColor[q.difficulty]}`}>
                      {difficultyLabel[q.difficulty]}
                    </span>
                    {isBuiltIn && (
                      <span className="px-2 py-0.5 bg-purple-900/40 text-purple-400 rounded-full text-xs">مدمج</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {!isBuiltIn && (
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleEdit(q)}
                      className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs font-semibold transition-colors"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => handleDelete(q.id)}
                      className="px-3 py-1 rounded-lg bg-red-900/20 hover:bg-red-900/40 text-red-400 text-xs font-semibold transition-colors"
                    >
                      حذف
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Stats summary */}
        <div className="glass-card p-4">
          <p className="text-white/40 text-xs text-center">
            إجمالي الأسئلة: <span className="text-white/70 font-bold">{allQuestions.length}</span>
            {" · "}
            مدمجة: <span className="text-white/70 font-bold">{DEFAULT_QUESTIONS.length}</span>
            {" · "}
            مخصصة: <span className="text-white/70 font-bold">{customQuestions.length}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
