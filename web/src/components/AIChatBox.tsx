"use client";

import {
  useCallback,
  useEffect,
  useId,
  useReducer,
  useRef,
} from "react";
import { MessageCircle, Send, X, Minus, Maximize2 } from "lucide-react";

import { TRPCClientError } from "@trpc/client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/react";

const STORAGE_KEY = "tradescore-ai-chat-v1";

type ChatMessage = {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: number;
};

type ChatState = {
  messages: ChatMessage[];
  isOpen: boolean;
  isMinimized: boolean;
  isLoading: boolean;
  error?: string;
  conversationId?: string;
  userRole: "homeowner" | "tradesman" | null;
  suggestedTopics: string[];
};

type ChatAction =
  | { type: "TOGGLE_OPEN" }
  | { type: "MINIMIZE" }
  | { type: "EXPAND" }
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "SET_ERROR"; error?: string }
  | { type: "SET_CONVERSATION"; conversationId: string }
  | { type: "SET_ROLE"; role: "homeowner" | "tradesman" | null }
  | { type: "ADD_MESSAGE"; message: ChatMessage }
  | { type: "CLEAR_MESSAGES" }
  | { type: "SET_SUGGESTED"; topics: string[] }
  | { type: "HYDRATE"; messages: ChatMessage[]; conversationId: string };

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "TOGGLE_OPEN":
      return { ...state, isOpen: !state.isOpen, isMinimized: false, error: undefined };
    case "MINIMIZE":
      return { ...state, isMinimized: true };
    case "EXPAND":
      return { ...state, isMinimized: false };
    case "SET_LOADING":
      return { ...state, isLoading: action.loading };
    case "SET_ERROR":
      return { ...state, error: action.error };
    case "SET_CONVERSATION":
      return { ...state, conversationId: action.conversationId };
    case "SET_ROLE":
      return { ...state, userRole: action.role };
    case "ADD_MESSAGE":
      return { ...state, messages: [...state.messages, action.message] };
    case "CLEAR_MESSAGES":
      return {
        ...state,
        messages: [],
        conversationId: undefined,
        suggestedTopics: [],
        error: undefined,
      };
    case "SET_SUGGESTED":
      return { ...state, suggestedTopics: action.topics };
    case "HYDRATE":
      return {
        ...state,
        messages: action.messages,
        conversationId: action.conversationId,
      };
    default:
      return state;
  }
}

function loadPersisted(): Partial<Pick<ChatState, "messages" | "conversationId" | "userRole">> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw) as {
      messages?: ChatMessage[];
      conversationId?: string;
      userRole?: "homeowner" | "tradesman" | null;
    };
    return {
      messages: data.messages ?? [],
      conversationId: data.conversationId,
      userRole: data.userRole ?? null,
    };
  } catch {
    return {};
  }
}

function persistState(state: Pick<ChatState, "messages" | "conversationId" | "userRole">) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        messages: state.messages,
        conversationId: state.conversationId,
        userRole: state.userRole,
      }),
    );
  } catch {
    /* quota */
  }
}

export function AIChatBox() {
  const panelId = useId();
  const launcherId = useId();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [state, dispatch] = useReducer(chatReducer, {
    messages: [],
    isOpen: false,
    isMinimized: false,
    isLoading: false,
    userRole: null,
    suggestedTopics: [],
  });

  const sendMutation = trpc.chat.sendMessage.useMutation();

  useEffect(() => {
    const saved = loadPersisted();
    if (saved.conversationId && saved.messages?.length) {
      dispatch({
        type: "HYDRATE",
        messages: saved.messages,
        conversationId: saved.conversationId,
      });
    }
    if (saved.userRole !== undefined && saved.userRole !== null) {
      dispatch({ type: "SET_ROLE", role: saved.userRole });
    }
  }, []);

  useEffect(() => {
    persistState({
      messages: state.messages,
      conversationId: state.conversationId,
      userRole: state.userRole,
    });
  }, [state.messages, state.conversationId, state.userRole]);

  useEffect(() => {
    if (!state.isOpen || state.isMinimized) return;
    const el = scrollRef.current?.querySelector("[data-slot=scroll-area-viewport]");
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [state.messages, state.isOpen, state.isMinimized, state.isLoading]);

  useEffect(() => {
    if (state.isOpen && !state.isMinimized) {
      inputRef.current?.focus();
    }
  }, [state.isOpen, state.isMinimized]);

  useEffect(() => {
    if (!state.isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        dispatch({ type: "MINIMIZE" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state.isOpen]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || state.isLoading) return;

      dispatch({ type: "SET_ERROR", error: undefined });
      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        type: "user",
        content: trimmed,
        timestamp: Date.now(),
      };
      dispatch({ type: "ADD_MESSAGE", message: userMsg });
      dispatch({ type: "SET_LOADING", loading: true });
      dispatch({ type: "SET_SUGGESTED", topics: [] });

      try {
        const pageContext =
          typeof window !== "undefined" ? window.location.pathname : undefined;
        const res = await sendMutation.mutateAsync({
          message: trimmed,
          conversationId: state.conversationId,
          userRole: state.userRole ?? undefined,
          pageContext,
        });
        dispatch({ type: "SET_CONVERSATION", conversationId: res.conversationId });
        dispatch({
          type: "ADD_MESSAGE",
          message: {
            id: `a-${Date.now()}`,
            type: "assistant",
            content: res.response,
            timestamp: Date.now(),
          },
        });
        dispatch({ type: "SET_SUGGESTED", topics: res.suggestedTopics ?? [] });
      } catch (e) {
        const msg =
          e instanceof TRPCClientError
            ? e.message
            : e instanceof Error
              ? e.message
              : "Something went wrong. Try again or email hello@tradescore.uk.";
        dispatch({ type: "SET_ERROR", error: msg });
      } finally {
        dispatch({ type: "SET_LOADING", loading: false });
      }
    },
    [sendMutation, state.conversationId, state.isLoading, state.userRole],
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    const text = String(fd.get("message") ?? "");
    if (!text.trim()) return;
    void sendMessage(text);
    form.reset();
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col items-end gap-2 sm:bottom-6 sm:right-6">
        {state.isOpen && !state.isMinimized ? (
          <div
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${panelId}-title`}
            className={cn(
              "flex max-h-[min(640px,85dvh)] w-[min(100vw-2rem,400px)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl shadow-black/50 ring-1 ring-[#FF6B35]/20",
              "animate-in fade-in zoom-in-95 duration-200",
            )}
          >
            <header className="flex items-center justify-between gap-2 border-b border-white/10 bg-zinc-900/90 px-3 py-2.5">
              <div className="min-w-0">
                <p
                  id={`${panelId}-title`}
                  className="truncate text-sm font-semibold text-foreground"
                >
                  TradeScore Assistant
                </p>
                <p className="text-xs text-muted-foreground">
                  24/7 answers · Escalates when needed
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <label className="sr-only" htmlFor={`${panelId}-role`}>
                  I am a
                </label>
                <select
                  id={`${panelId}-role`}
                  value={state.userRole ?? ""}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_ROLE",
                      role:
                        e.target.value === "homeowner" || e.target.value === "tradesman"
                          ? e.target.value
                          : null,
                    })
                  }
                  className="max-w-[120px] rounded-md border border-white/15 bg-zinc-900 px-2 py-1 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35]/50"
                >
                  <option value="">Role…</option>
                  <option value="homeowner">🏠 Homeowner</option>
                  <option value="tradesman">🔧 Tradesperson</option>
                </select>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground"
                  onClick={() => dispatch({ type: "MINIMIZE" })}
                  aria-label="Minimize chat"
                >
                  <Minus className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground"
                  onClick={() => dispatch({ type: "TOGGLE_OPEN" })}
                  aria-label="Close chat"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </header>

            <div ref={scrollRef} className="min-h-0 flex-1 overflow-hidden">
              <ScrollArea className="h-[min(320px,42dvh)] px-3 py-2 sm:h-[min(380px,48dvh)]">
              <ul className="space-y-3 pb-2" aria-live="polite">
                {state.messages.length === 0 ? (
                  <li className="rounded-lg bg-white/[0.04] px-3 py-3 text-sm text-muted-foreground">
                    Hi — I’m here for quick answers on pricing, leads, payments,
                    and how TradeScore works. Pick your role above for sharper
                    tips, or just ask a question.
                  </li>
                ) : null}
                {state.messages.map((m) => (
                  <li
                    key={m.id}
                    className={cn(
                      "flex",
                      m.type === "user" ? "justify-end" : "justify-start",
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                        m.type === "user"
                          ? "bg-[#FF6B35] text-white"
                          : "border border-white/10 bg-zinc-900/80 text-foreground",
                      )}
                    >
                      <p className="whitespace-pre-wrap">{m.content}</p>
                      <p
                        className={cn(
                          "mt-1 text-[10px] opacity-70",
                          m.type === "user" ? "text-right" : "text-left",
                        )}
                      >
                        {new Date(m.timestamp).toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </li>
                ))}
                {state.isLoading ? (
                  <li className="text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      <span className="flex gap-0.5">
                        <span className="size-1.5 animate-bounce rounded-full bg-[#FF6B35] [animation-delay:-0.2s]" />
                        <span className="size-1.5 animate-bounce rounded-full bg-[#FF6B35] [animation-delay:-0.1s]" />
                        <span className="size-1.5 animate-bounce rounded-full bg-[#FF6B35]" />
                      </span>
                      Assistant is typing…
                    </span>
                  </li>
                ) : null}
              </ul>
              </ScrollArea>
            </div>

            {state.suggestedTopics.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 border-t border-white/5 px-3 py-2">
                {state.suggestedTopics.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => void sendMessage(t)}
                    className="rounded-full border border-[#FF6B35]/35 bg-[#FF6B35]/10 px-2.5 py-1 text-xs font-medium text-[#FF6B35] transition-colors hover:bg-[#FF6B35]/20"
                  >
                    {t}
                  </button>
                ))}
              </div>
            ) : null}

            {state.error ? (
              <p className="px-3 pb-1 text-xs text-red-400" role="alert">
                {state.error}
              </p>
            ) : null}

            <form
              onSubmit={onSubmit}
              className="flex gap-2 border-t border-white/10 bg-zinc-900/80 p-2"
            >
              <label className="sr-only" htmlFor={`${panelId}-input`}>
                Message
              </label>
              <textarea
                id={`${panelId}-input`}
                ref={inputRef}
                name="message"
                rows={2}
                maxLength={2000}
                placeholder="Ask about leads, pricing, payments…"
                disabled={state.isLoading}
                className="min-h-[44px] flex-1 resize-none rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-[#FF6B35]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35]/30"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
              />
              <Button
                type="submit"
                disabled={state.isLoading}
                className="h-auto shrink-0 self-end border-0 bg-[#FF6B35] px-3 text-white hover:bg-[#e85f2d]"
                aria-label="Send message"
              >
                <Send className="size-4" />
              </Button>
            </form>

            <div className="flex items-center justify-between gap-2 border-t border-white/5 px-2 py-1.5 text-[10px] text-muted-foreground">
              <button
                type="button"
                className="underline-offset-2 hover:text-foreground hover:underline"
                onClick={() => {
                  dispatch({ type: "CLEAR_MESSAGES" });
                  localStorage.removeItem(STORAGE_KEY);
                }}
              >
                New chat
              </button>
              <span>hello@tradescore.uk</span>
            </div>
          </div>
        ) : null}

        {state.isOpen && state.isMinimized ? (
          <Button
            type="button"
            onClick={() => dispatch({ type: "EXPAND" })}
            className="h-12 gap-2 rounded-full border-0 bg-[#FF6B35] px-4 text-white shadow-lg hover:bg-[#e85f2d]"
            aria-expanded={false}
            aria-controls={panelId}
          >
            <Maximize2 className="size-4" />
            Chat
          </Button>
        ) : null}

        {!state.isOpen ? (
          <Button
            id={launcherId}
            type="button"
            onClick={() => dispatch({ type: "TOGGLE_OPEN" })}
            className="h-14 w-14 rounded-full border-0 bg-[#FF6B35] p-0 text-white shadow-lg hover:bg-[#e85f2d] sm:h-14 sm:w-14"
            aria-haspopup="dialog"
            aria-controls={panelId}
            aria-expanded={state.isOpen}
            aria-label="Open TradeScore support chat"
          >
            <MessageCircle className="size-6" />
          </Button>
        ) : null}
      </div>
    </>
  );
}
