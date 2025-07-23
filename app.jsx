const { useState, useEffect, useRef } = React;

function App() {
  // Estado: tarjetas (desde localStorage o inicial)
  const [cards, setCards] = useState(() => {
    try {
      const saved = localStorage.getItem("cards");
      return saved
        ? JSON.parse(saved)
        : [
            { id: 1, german: "Apfel", translation: "Manzana" },
            { id: 2, german: "Haus", translation: "Casa" },
            { id: 3, german: "Buch", translation: "Libro" },
          ];
    } catch {
      // Si el JSON está corrupto, usar el array inicial
      return [
        { id: 1, german: "Apfel", translation: "Manzana" },
        { id: 2, german: "Haus", translation: "Casa" },
        { id: 3, german: "Buch", translation: "Libro" },
      ];
    }
  });

  // Sincronizar localStorage
  useEffect(() => {
    localStorage.setItem("cards", JSON.stringify(cards));
  }, [cards]);

  // Estado de la práctica
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputAnswer, setInputAnswer] = useState("");
  const [feedback, setFeedback] = useState(null); // 'correct' | 'wrong' | null
  const [score, setScore] = useState({ correct: 0, wrong: 0 });

  // Ref para el input
  const inputRef = useRef(null);

  // Mezclar las tarjetas al cargar
  useEffect(() => {
    setCurrentIndex(0);
    setInputAnswer("");
    setFeedback(null);
    setScore({ correct: 0, wrong: 0 });

    // Barajar tarjetas
    setCards((cards) => shuffleArray(cards));
  }, []);

  // Función para barajar un array (Fisher-Yates)
  function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Comprobar respuesta
  const checkAnswer = () => {
    if (!inputAnswer.trim()) return;

    const correctTranslation = cards[currentIndex]?.translation.toLowerCase().trim() || "";
    if (inputAnswer.toLowerCase().trim() === correctTranslation) {
      setFeedback("correct");
      setScore((s) => ({ ...s, correct: s.correct + 1 }));
    } else {
      setFeedback("wrong");
      setScore((s) => ({ ...s, wrong: s.wrong + 1 }));
    }
  };

  // Pasar a siguiente tarjeta
  const nextCard = () => {
    setInputAnswer("");
    setFeedback(null);
    setCurrentIndex((i) => (cards.length ? (i + 1) % cards.length : 0));
    // Focus input para seguir rápido
    inputRef.current?.focus();
  };

  // Saltar tarjeta (sin contar)
  const skipCard = () => {
    setInputAnswer("");
    setFeedback(null);
    setCurrentIndex((i) => (cards.length ? (i + 1) % cards.length : 0));
    inputRef.current?.focus();
  };

  // Añadir nueva tarjeta, evitando duplicados
  const [newGerman, setNewGerman] = useState("");
  const [newTranslation, setNewTranslation] = useState("");
  const [addError, setAddError] = useState("");

  const handleAdd = () => {
    const g = newGerman.trim();
    const t = newTranslation.trim();

    if (!g || !t) {
      setAddError("Por favor completa ambos campos.");
      return;
    }
    // Validar duplicados (por palabra alemana)
    if (cards.some((c) => c.german.toLowerCase() === g.toLowerCase())) {
      setAddError("Esa palabra ya existe.");
      return;
    }

    const newCard = { id: Date.now(), german: g, translation: t };
    setCards((c) => [...c, newCard]);
    setNewGerman("");
    setNewTranslation("");
    setAddError("");
  };

  // Función para síntesis de voz en alemán
  const speakGerman = (text) => {
    if (!("speechSynthesis" in window)) {
      alert("Tu navegador no soporta síntesis de voz");
      return;
    }
    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "de-DE";
    speechSynthesis.speak(utterance);
  };

  const currentCard = cards[currentIndex] || {};

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      <h1 className="text-4xl font-bold text-primary mb-8 text-center select-none">
        Sprachkarten - Practica tu alemán
      </h1>

      {/* Tarjeta de práctica */}
      <section
        aria-live="polite"
        aria-atomic="true"
        className="bg-white p-8 rounded-xl shadow-md max-w-md mx-auto mb-6 select-none"
      >
        <div className="flex items-center justify-center mb-4 space-x-4">
          <span className="text-5xl font-extrabold">{currentCard.german || "No hay tarjetas"}</span>
          <button
            onClick={() => speakGerman(currentCard.german)}
            aria-label={`Escuchar la palabra ${currentCard.german || ""}`}
            className="p-2 rounded-full bg-primary text-white hover:bg-blue-700 transition"
            disabled={!currentCard.german}
          >
            🔊
          </button>
        </div>

        <input
          ref={inputRef}
          type="text"
          aria-label="Introduce la traducción al español"
          placeholder="Escribe la traducción..."
          value={inputAnswer}
          onChange={(e) => setInputAnswer(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") checkAnswer();
          }}
          disabled={feedback === "correct" || !currentCard.german}
          className={`w-full border rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2
            ${
              feedback === "correct"
                ? "border-green-500 ring-green-300"
                : feedback === "wrong"
                ? "border-red-500 ring-red-300"
                : "border-gray-300 focus:ring-primary"
            }`}
          autoComplete="off"
          spellCheck="false"
        />

        {/* Feedback */}
        {feedback === "correct" && (
          <p className="mt-3 text-green-600 font-semibold select-text">¡Correcto! 🎉</p>
        )}
        {feedback === "wrong" && (
          <p className="mt-3 text-red-600 font-semibold select-text">
            Incorrecto, la respuesta correcta es: <strong>{currentCard.translation}</strong>
          </p>
        )}

        {/* Botones */}
        <div className="mt-6 flex justify-center space-x-4">
          {feedback === null && (
            <button
              onClick={checkAnswer}
              className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition focus:outline-none focus:ring-4 focus:ring-primary"
              disabled={!currentCard.german}
            >
              Comprobar
            </button>
          )}

          {(feedback === "correct" || feedback === "wrong") && (
            <button
              onClick={nextCard}
              className="bg-yellow-400 text-gray-900 px-6 py-2 rounded-lg hover:bg-yellow-500 transition focus:outline-none focus:ring-4 focus:ring-yellow-400"
            >
              Siguiente
            </button>
          )}

          <button
            onClick={skipCard}
            className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition focus:outline-none focus:ring-4 focus:ring-gray-400"
            disabled={!currentCard.german}
          >
            Saltar
          </button>
        </div>
      </section>

      {/* Puntuación */}
      <section className="text-center mb-10 select-none">
        <p className="text-lg font-semibold">
          ✔️ Correctas: <span className="text-green-600">{score.correct}</span> | ❌ Incorrectas:{" "}
          <span className="text-red-600">{score.wrong}</span>
        </p>
      </section>

      {/* Formulario añadir tarjeta */}
      <section className="max-w-md mx-auto">
        <h2 className="text-2xl font-semibold mb-4 select-none">Añadir nueva palabra</h2>

        <div className="flex flex-col sm:flex-row gap-4 mb-2">
          <input
            type="text"
            aria-label="Nueva palabra en alemán"
            placeholder="Palabra en alemán"
            value={newGerman}
            onChange={(e) => setNewGerman(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 w-full sm:w-1/2 focus:outline-none focus:ring-2 focus:ring-primary"
            autoComplete="off"
          />
          <input
            type="text"
            aria-label="Traducción al español"
            placeholder="Traducción"
            value={newTranslation}
            onChange={(e) => setNewTranslation(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 w-full sm:w-1/2 focus:outline-none focus:ring-2 focus:ring-primary"
            autoComplete="off"
          />
        </div>

        {addError && (
          <p className="text-red-600 font-semibold mb-2 select-text" role="alert">
            {addError}
          </p>
        )}

        <button
          onClick={handleAdd}
          className="bg-primary text-white font-semibold px-6 py-2 rounded-lg hover:bg-blue-700 transition w-full sm:w-auto"
          aria-label="Añadir nueva palabra"
        >
          Añadir
        </button>
      </section>
    </div>
  );
}

// Renderizar en root
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
