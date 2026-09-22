import { useEffect, useReducer, useRef } from "react";
import questionsData from "../src/question.json";

const TIME_LIMIT = 5 * 60;
const STORAGE_KEY = "assessment-app-state";

const createInitialState = () => ({
  questions: questionsData,
  currentQuestion: 0,
  userAnswers: {},
  timer: TIME_LIMIT,
  quizStatus: "not-started",
});

function quizReducer(state, action) {
  switch (action.type) {
    case "START":
      return {
        ...createInitialState(),
        quizStatus: "in-progress",
      };

    case "SELECT_ANSWER":
      return {
        ...state,
        userAnswers: {
          ...state.userAnswers,
          [action.payload.questionId]: action.payload.answer,
        },
      };

    case "NEXT":
      return {
        ...state,
        currentQuestion: Math.min(
          state.currentQuestion + 1,
          state.questions.length - 1
        ),
      };

    case "PREVIOUS":
      return {
        ...state,
        currentQuestion: Math.max(state.currentQuestion - 1, 0),
      };

    case "TICK":
      if (state.timer <= 1) {
        return {
          ...state,
          timer: 0,
          quizStatus: "submitted",
        };
      }

      return {
        ...state,
        timer: state.timer - 1,
      };

    case "SUBMIT":
      return {
        ...state,
        quizStatus: "submitted",
      };

    case "RESTORE":
      return {
        ...state,
        ...action.payload,
        questions: questionsData,
      };

    case "RESTART":
      return createInitialState();

    default:
      return state;
  }
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");

  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  return `${minutes}:${seconds}`;
}

function App() {
  const [state, dispatch] = useReducer(
    quizReducer,
    undefined,
    createInitialState
  );
     
  const hasRestored = useRef(false);

  const {
    questions,
    currentQuestion,
    userAnswers,
    timer,
    quizStatus,
  } = state;

  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);

    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);

        if (
          parsedState &&
          ["not-started", "in-progress", "submitted"].includes(
            parsedState.quizStatus
          )
        ) {
          dispatch({
            type: "RESTORE",
            payload: parsedState,
          });
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    hasRestored.current = true;
  }, []);

  useEffect(() => {
    if (!hasRestored.current) return;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (quizStatus !== "in-progress") return;

    const interval = window.setInterval(() => {
      dispatch({ type: "TICK" });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [quizStatus]);

  const current = questions[currentQuestion];

  const score = questions.reduce((total, question) => {
    const answer = userAnswers[question.id];

    return total + (answer === question.correctAnswer ? 1 : 0);
  }, 0);

  const percentage = Math.round(
    (score / questions.length) * 100
  );

  const answeredCount = Object.keys(userAnswers).length;

  const handleRestart = () => {
    localStorage.removeItem(STORAGE_KEY);

    dispatch({
      type: "RESTART",
    });
  };

  if (quizStatus === "not-started") {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex flex-col min-h-[calc(100vh-4rem)] max-w-5xl items-center justify-center">
          <section className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70">
            <div className="border-b border-slate-100 px-6 py-6 sm:px-10 sm:py-8">
              <div className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">
                Assessment 
              </div>

              <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Frontend Assessment
              </h1>

              <p className="mt-3 max-w-xl   text-sm leading-6 text-slate-600 sm:text-base">
                Test your frontend fundamentals. Your progress is saved
                automatically, so you can continue after refreshing the page.
              </p>
            </div>

            <div className="px-6 py-6 sm:px-10 sm:py-8">
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoCard
                  label="Questions"
                  value={questions.length}
                />

                <InfoCard
                  label="Time limit"
                  value="5 minutes"
                />
              </div>

              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                The assessment will be submitted automatically when the
                timer reaches zero.
              </div>

              <button
                type="button"
                onClick={() =>
                  dispatch({
                    type: "START",
                  })
                }
                className="mt-8 w-full rounded-2xl bg-blue-400 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100"
              >
                Start Assessment
              </button>
            </div>
          </section>
          {/* <p>Made with ❤️ by Rohit SP</p> */}
        </div>
      </main>
    );
  }

  if (quizStatus === "submitted") {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
            <div className="border-b border-slate-200 px-5 py-6 sm:px-8 sm:py-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
                    Assessment complete
                  </div>

                  <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
                    Your Result
                  </h1>

                  <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
                    Review every response and compare it with the correct
                    answer.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleRestart}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 md:w-auto"
                >
                  Restart Assessment
                </button>
              </div>
            </div>

            <div className="px-5 py-6 sm:px-8 sm:py-8">
              <div className="grid gap-4 sm:grid-cols-3">
                <ResultCard
                  label="Score"
                  value={`${score}/${questions.length}`}
                />

                <ResultCard
                  label="Total Questions"
                  value={questions.length}
                />

                <ResultCard
                  label="Percentage"
                  value={`${percentage}%`}
                />
              </div>

              <div className="mt-10">
                <h2 className="text-xl font-bold text-slate-950">
                  Review
                </h2>

                <div className="mt-5 space-y-5">
                  {questions.map((question, index) => {
                    const selectedAnswer =
                      userAnswers[question.id];

                    const isCorrect =
                      selectedAnswer === question.correctAnswer;

                    return (
                      <article
                        key={question.id}
                        className="rounded-2xl border border-slate-200 p-4 sm:p-6"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                              Question {index + 1}
                            </p>

                            <h3 className="mt-2 text-base font-semibold leading-7 text-slate-950 sm:text-lg">
                              {question.question}
                            </h3>
                          </div>

                          <span
                            className={`w-fit shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                              isCorrect
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            {isCorrect
                              ? "Correct"
                              : "Incorrect"}
                          </span>
                        </div>

                        <div className="mt-5 grid gap-3 md:grid-cols-2">
                          <AnswerCard
                            label="Your answer"
                            value={
                              selectedAnswer ||
                              "Not answered"
                            }
                          />

                          <AnswerCard
                            label="Correct answer"
                            value={question.correctAnswer}
                          />
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-5 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
              Frontend Assessment
            </p>

            <h1 className="mt-1 text-xl font-bold text-slate-950 sm:text-2xl">
              Question {currentQuestion + 1} of{" "}
              {questions.length}
            </h1>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-950 px-4 py-3 text-white sm:justify-start">
            <span className="text-sm text-slate-300">
              Time left
            </span>

            <span
              className={`font-mono text-lg font-bold ${
                timer <= 30
                  ? "text-rose-300"
                  : ""
              }`}
            >
              {formatTime(timer)}
            </span>
          </div>
        </header>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50 sm:p-8">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="w-full sm:w-auto">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-semibold text-indigo-600">
                  Progress
                </p>

                <p className="text-sm text-slate-500 sm:hidden">
                  {answeredCount}/{questions.length} answered
                </p>
              </div>

              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 sm:w-80">
                <div
                  className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                  style={{
                    width: `${
                      ((currentQuestion + 1) /
                        questions.length) *
                      100
                    }%`,
                  }}
                />
              </div>
            </div>

            <p className="hidden text-sm text-slate-500 sm:block">
              Answered {answeredCount}/{questions.length}
            </p>
          </div>

          <div className="py-7 sm:py-9">
            <h2 className="text-xl font-bold leading-8 text-slate-950 sm:text-2xl">
              {current.question}
            </h2>

            <div className="mt-6 grid gap-3">
              {current.options.map((option, index) => {
                const selected =
                  userAnswers[current.id] === option;

                return (
                  <button
                    type="button"
                    key={option}
                    onClick={() =>
                      dispatch({
                        type: "SELECT_ANSWER",
                        payload: {
                          questionId: current.id,
                          answer: option,
                        },
                      })
                    }
                    className={`group flex w-full items-start gap-3 rounded-2xl border p-4 text-left text-sm font-medium transition sm:p-5 sm:text-base ${
                      selected
                        ? "border-indigo-600 bg-indigo-50 text-indigo-950 ring-2 ring-indigo-100"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        selected
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                      }`}
                    >
                      {String.fromCharCode(65 + index)}
                    </span>

                    <span className="pt-1">
                      {option}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() =>
                dispatch({
                  type: "PREVIOUS",
                })
              }
              disabled={currentQuestion === 0}
              className="w-full rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
            >
              Previous
            </button>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <button
                type="button"
                onClick={() =>
                  dispatch({
                    type: "SUBMIT",
                  })
                }
                className="w-full rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 sm:w-auto"
              >
                Submit
              </button>

              {currentQuestion <
                questions.length - 1 && (
                <button
                  type="button"
                  onClick={() =>
                    dispatch({
                      type: "NEXT",
                    })
                  }
                  className="w-full rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 sm:w-auto"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-sm font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-slate-950">
        {value}
      </p>
    </div>
  );
}

function ResultCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-sm font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-3xl font-bold text-slate-950">
        {value}
      </p>
    </div>
  );
}

function AnswerCard({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-semibold leading-6 text-slate-800">
        {value}
      </p>
    </div>
  );
}

export default App;