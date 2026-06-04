import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { X, Upload, Download, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiClient } from '../../../lib/api/client';
import { useCategories } from '../../../lib/buyer/hooks/useCategories';

type ImportFailure = { index: number; title?: string; error: string };
type ImportResult = { created: number; failed: ImportFailure[] };

const TEMPLATE_HEADERS = [
  'title',
  'description',
  'price_naira',
  'quantity',
  'category',
  'tags',
  'sellingMode',
  'moq',
  'leadTimeDays',
];
const TEMPLATE_SAMPLE =
  'Premium Rice 50kg,Long-grain parboiled rice,32000,100,Groceries,rice;staples,B2B_ONLY,10,3';

// Minimal CSV parser: handles quoted fields, escaped quotes ("") and CRLF.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (c !== '\r') field += c;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

interface BuiltProduct {
  title: string;
  description?: string;
  price: number;
  quantity: number;
  categoryIds: string[];
  tags?: string[];
  sellingMode: 'B2C_ONLY' | 'B2B_ONLY';
  moq?: number;
  leadTimeDays?: number;
  priceTiers?: { minQuantity: number; maxQuantity: number; priceKobo: number }[];
  publish: boolean;
}

export default function BulkProductImport({ onComplete }: { onComplete?: () => void }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [parseErrors, setParseErrors] = useState<string[]>([]);

  const { data } = useCategories();
  const categoryByName = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of data?.categories ?? []) map.set(c.name.trim().toLowerCase(), c.id);
    return map;
  }, [data]);

  const reset = () => {
    setResult(null);
    setParseErrors([]);
  };

  const downloadTemplate = () => {
    const csv = `${TEMPLATE_HEADERS.join(',')}\n${TEMPLATE_SAMPLE}\n`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'carryofy-products-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = async (file: File) => {
    reset();
    const text = await file.text();
    const rows = parseCsv(text);
    if (rows.length < 2) {
      setParseErrors(['No data rows found. Use the template and add at least one product.']);
      return;
    }
    const header = rows[0].map((h) => h.trim().toLowerCase());
    const col = {
      title: header.indexOf('title'),
      description: header.indexOf('description'),
      price: header.indexOf('price_naira'),
      quantity: header.indexOf('quantity'),
      category: header.indexOf('category'),
      tags: header.indexOf('tags'),
      sellingMode: header.indexOf('sellingmode'),
      moq: header.indexOf('moq'),
      leadTimeDays: header.indexOf('leadtimedays'),
    };
    if (col.title < 0 || col.price < 0 || col.quantity < 0 || col.category < 0) {
      setParseErrors([
        'Missing required columns. Required: title, price_naira, quantity, category. Download the template.',
      ]);
      return;
    }

    const products: BuiltProduct[] = [];
    const errors: string[] = [];
    for (let r = 1; r < rows.length; r++) {
      const cells = rows[r];
      const get = (i: number) => (i >= 0 && i < cells.length ? cells[i].trim() : '');
      const rowNo = r + 1;
      const title = get(col.title);
      if (!title) {
        errors.push(`Row ${rowNo}: missing title.`);
        continue;
      }
      const priceNaira = parseFloat(get(col.price));
      if (!Number.isFinite(priceNaira) || priceNaira <= 0) {
        errors.push(`Row ${rowNo} (${title}): invalid price.`);
        continue;
      }
      const quantity = parseInt(get(col.quantity), 10);
      if (!Number.isInteger(quantity) || quantity < 0) {
        errors.push(`Row ${rowNo} (${title}): invalid quantity.`);
        continue;
      }
      const catName = get(col.category);
      const categoryId = categoryByName.get(catName.toLowerCase());
      if (!categoryId) {
        errors.push(`Row ${rowNo} (${title}): unknown category "${catName}".`);
        continue;
      }

      const priceKobo = Math.round(priceNaira * 100);
      const sellingMode: 'B2C_ONLY' | 'B2B_ONLY' =
        get(col.sellingMode).toUpperCase() === 'B2B_ONLY' ? 'B2B_ONLY' : 'B2C_ONLY';
      const moq = parseInt(get(col.moq), 10);
      const leadTimeDays = parseInt(get(col.leadTimeDays), 10);
      const tags = get(col.tags)
        .split(';')
        .map((t) => t.trim())
        .filter(Boolean);

      const product: BuiltProduct = {
        title,
        description: get(col.description) || undefined,
        price: priceKobo,
        quantity,
        categoryIds: [categoryId],
        tags: tags.length ? tags : undefined,
        sellingMode,
        publish: true,
      };
      if (Number.isInteger(moq) && moq >= 1) product.moq = moq;
      if (Number.isInteger(leadTimeDays) && leadTimeDays >= 0) product.leadTimeDays = leadTimeDays;
      if (sellingMode === 'B2B_ONLY') {
        const minQ = Number.isInteger(moq) && moq >= 1 ? moq : 1;
        // One open-ended wholesale tier from the row's price + MOQ.
        product.priceTiers = [{ minQuantity: minQ, maxQuantity: 999999, priceKobo }];
      }
      products.push(product);
    }

    setParseErrors(errors);
    if (products.length === 0) {
      if (errors.length === 0) setParseErrors(['No valid product rows found.']);
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiClient.post('/products/bulk', { products });
      const payload = (res.data?.data ?? res.data) as ImportResult;
      setResult(payload);
      if (payload.created > 0) {
        toast.success(
          `${payload.created} product${payload.created === 1 ? '' : 's'} imported.`,
        );
        onComplete?.();
      }
      if (payload.failed?.length) {
        toast.error(
          `${payload.failed.length} row${payload.failed.length === 1 ? '' : 's'} failed to import.`,
        );
      }
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(typeof msg === 'string' ? msg : 'Import failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          reset();
          setOpen(true);
        }}
        className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#ff6600]/40 text-[#ffcc99] font-medium rounded-xl hover:border-[#ff6600] hover:text-white transition-all"
      >
        <Upload className="w-5 h-5" />
        Import CSV
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => !submitting && setOpen(false)}
        >
          <div
            className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-2xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white text-xl font-bold">Import products from CSV</h2>
              <button
                onClick={() => !submitting && setOpen(false)}
                className="text-[#ffcc99]/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[#ffcc99]/80 text-sm mb-4">
              Upload a CSV to create many products at once. Prices are in naira (₦). For wholesale
              rows set <code className="text-[#ffcc99]">sellingMode</code> to{' '}
              <code className="text-[#ffcc99]">B2B_ONLY</code> and a{' '}
              <code className="text-[#ffcc99]">moq</code> — a single wholesale price tier is created
              from the price + MOQ. For tiered wholesale pricing, use Add Product instead.
            </p>

            <button
              onClick={downloadTemplate}
              className="inline-flex items-center gap-2 text-[#FF6B00] hover:underline text-sm font-medium mb-4"
            >
              <Download className="w-4 h-4" /> Download template
            </button>

            <input
              type="file"
              accept=".csv,text/csv"
              disabled={submitting}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.currentTarget.value = '';
              }}
              className="block w-full text-sm text-[#ffcc99] file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#ff6600] file:text-white file:font-medium hover:file:bg-[#cc5200] file:cursor-pointer"
            />

            {submitting && (
              <div className="flex items-center gap-2 text-[#ffcc99] text-sm mt-4">
                <Loader2 className="w-4 h-4 animate-spin" /> Importing…
              </div>
            )}

            {parseErrors.length > 0 && (
              <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <p className="text-red-400 text-sm font-medium mb-1">
                  {parseErrors.length} row{parseErrors.length === 1 ? '' : 's'} skipped:
                </p>
                <ul className="text-red-300/90 text-xs space-y-1 max-h-32 overflow-y-auto">
                  {parseErrors.slice(0, 25).map((er, i) => (
                    <li key={i}>{er}</li>
                  ))}
                </ul>
              </div>
            )}

            {result && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <CheckCircle2 className="w-4 h-4" /> {result.created} created
                </div>
                {result.failed?.length > 0 && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                    <p className="text-red-400 text-sm font-medium mb-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" /> {result.failed.length} failed
                    </p>
                    <ul className="text-red-300/90 text-xs space-y-1 max-h-40 overflow-y-auto">
                      {result.failed.map((f, i) => (
                        <li key={i}>
                          {f.title || `Item #${f.index + 1}`}: {f.error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
