import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Send,
  ShoppingCart,
  Loader2,
  X,
  Package,
  ChevronRight,
} from 'lucide-react';
import { aiChatApi, ChatMessage } from '../../lib/api/ai-chat';
import { formatNgnFromKobo } from '../../lib/api/utils';
import apiClient from '../../lib/api/client';
import { useCart } from '../../lib/contexts/CartContext';
import { showSuccessToast, showErrorToast } from '../../lib/ui/toast';
import { useCategories } from '../../lib/shared/hooks/useCategories';
import { categoryDisplayName } from '../../lib/buyer/categoryDisplay';
import { getCategoryCoverImageUrl } from '../../lib/buyer/categoryCoverImage';
import BuyerCategoryCoverMedia from '../buyer/BuyerCategoryCoverMedia';

interface AIChatWindowProps {
  onClose: () => void;
}

interface ChatProduct {
  id: string;
  title: string;
  price: number;
  images?: string[];
}

const SUGGESTED_PROMPTS = [
  'Show me popular wholesale items',
  'Help me find products to restock',
  'What can I order for same-day delivery?',
];

export default function AIChatWindow({ onClose }: AIChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [addingProductId, setAddingProductId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { refreshCart } = useCart();
  const { data: categoriesData } = useCategories();

  const browseCategories = (categoriesData?.categories ?? [])
    .filter((c) => c.isActive !== false)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
    .slice(0, 6);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const sendText = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), sender: 'user', text: trimmed, timestamp: new Date() },
      ]);
      setInput('');
      setIsLoading(true);

      try {
        const response = await aiChatApi.sendMessage(trimmed);
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'ai',
            text: response.reply,
            timestamp: new Date(),
            products: response.products,
          },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'ai',
            text: 'The assistant is temporarily unavailable. Browse the catalogue or try again shortly.',
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
        inputRef.current?.focus();
      }
    },
    [isLoading],
  );

  const handleSend = () => void sendText(input);

  const handleAddToCart = useCallback(
    async (product: ChatProduct) => {
      setAddingProductId(product.id);
      try {
        await apiClient.post('/cart/items', { productId: product.id, quantity: 1 });
        await refreshCart();
        showSuccessToast(`Added ${product.title} to cart`);
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Could not add to cart';
        showErrorToast(msg);
      } finally {
        setAddingProductId(null);
      }
    },
    [refreshCart],
  );

  const showEmptyState = messages.length === 0 && !isLoading;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl shadow-zinc-900/10 ring-1 ring-zinc-950/5">
      <header className="shrink-0 border-b border-zinc-200 bg-zinc-50/90 px-4 py-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-sm">
              <Image
                src="/logo.png"
                alt="Carryofy"
                width={40}
                height={40}
                className="h-full w-full object-contain p-1.5"
              />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-[15px] font-bold text-zinc-900">Carryofy Assistant</h3>
              <p className="text-xs text-zinc-500">Product search · Orders · Cart</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-200/80 hover:text-zinc-800"
            aria-label="Close assistant"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-zinc-50/50 px-4 py-4">
        {showEmptyState && (
          <div className="space-y-5">
            <div className="rounded-xl border border-zinc-200 bg-white p-4 text-center shadow-sm">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Package className="h-5 w-5" strokeWidth={2} aria-hidden />
              </div>
              <p className="text-sm font-semibold text-zinc-900">How can we help you source today?</p>
              <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
                Ask about products, check availability, or add items to your wholesale cart.
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold text-zinc-600">Try asking</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void sendText(prompt)}
                    className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-left text-xs font-medium text-zinc-700 shadow-sm transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {browseCategories.length > 0 && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold text-zinc-600">Browse by category</p>
                  <Link
                    href="/buyer/products"
                    className="text-xs font-semibold text-primary hover:text-primary-dark"
                  >
                    View all
                  </Link>
                </div>
                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                  {browseCategories.map((cat) => {
                    const label = categoryDisplayName(cat.slug, cat.name);
                    const cover = getCategoryCoverImageUrl(cat.slug, cat.name, cat.icon);
                    return (
                      <Link
                        key={cat.id}
                        href={`/buyer/products?category=${encodeURIComponent(cat.slug)}`}
                        className="group relative h-[72px] w-[100px] shrink-0 overflow-hidden rounded-lg border border-zinc-200 shadow-sm"
                      >
                        <div className="absolute inset-0 z-0">
                          <BuyerCategoryCoverMedia
                            src={cover}
                            alt=""
                            sizes="100px"
                            categorySlug={cat.slug}
                            categoryName={cat.name}
                            className="object-cover transition duration-300 group-hover:scale-105"
                          />
                        </div>
                        <div
                          className="pointer-events-none absolute inset-0 z-[1] bg-linear-to-t from-zinc-950/85 via-zinc-950/40 to-transparent"
                          aria-hidden
                        />
                        <span className="absolute inset-x-0 bottom-0 z-[2] line-clamp-2 px-2 pb-2 text-[10px] font-semibold leading-tight text-white">
                          {label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  m.sender === 'user'
                    ? 'rounded-br-md bg-zinc-900 text-white'
                    : 'rounded-bl-md border border-zinc-200 bg-white text-zinc-800 shadow-sm'
                }`}
              >
                <p className="whitespace-pre-wrap">{m.text}</p>
                {m.products && (m.products as ChatProduct[]).length > 0 && (
                  <div className="mt-3 space-y-2 border-t border-zinc-100 pt-3">
                    {(m.products as ChatProduct[]).map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-2.5 rounded-xl border border-zinc-100 bg-zinc-50 p-2"
                      >
                        <Link
                          href={`/buyer/products/${p.id}`}
                          className="flex min-w-0 flex-1 items-center gap-2.5"
                        >
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-zinc-200">
                            {p.images?.[0] ? (
                              <Image src={p.images[0]} alt="" fill className="object-cover" sizes="48px" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-zinc-400">
                                <Package className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-zinc-900">{p.title}</p>
                            <p className="text-xs font-semibold text-primary">
                              {formatNgnFromKobo(p.price)}
                            </p>
                          </div>
                        </Link>
                        <button
                          type="button"
                          disabled={addingProductId === p.id}
                          onClick={() => handleAddToCart(p)}
                          className="shrink-0 rounded-lg bg-primary p-2 text-white transition hover:bg-primary-dark disabled:opacity-50"
                          aria-label={`Add ${p.title} to cart`}
                        >
                          {addingProductId === p.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <ShoppingCart className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-zinc-200 bg-white px-4 py-3 shadow-sm">
                <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden />
                <span className="text-xs text-zinc-500">Searching catalogue…</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="shrink-0 border-t border-zinc-200 bg-white p-3">
        <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-2 py-1.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask about products, orders, or stock…"
            className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
            autoComplete="off"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] text-zinc-400">
          Answers are based on live catalogue data.{' '}
          <Link href="/buyer/products" className="font-medium text-primary hover:underline">
            Open marketplace
            <ChevronRight className="ml-0.5 inline h-3 w-3" aria-hidden />
          </Link>
        </p>
      </footer>
    </div>
  );
}
