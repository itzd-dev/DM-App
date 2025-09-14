import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { products } from '../src/data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const toPgArray = (arr) => {
  if (!Array.isArray(arr)) return '{}';
  // Quote elements, escape embedded quotes and backslashes
  const escaped = arr.map((s) => {
    const str = String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    // Always quote to handle spaces and commas
    return `"${str}"`;
  });
  return `{${escaped.join(',')}}`;
};

const csvEscape = (value) => {
  if (value === null || value === undefined) return '';
  let str = String(value);
  if (str.includes('"')) str = str.replace(/"/g, '""');
  if (/[",\n]/.test(str)) return `"${str}"`;
  return str;
};

const headers = [
  // Omit 'id' so Supabase can auto-generate identity
  'name',
  'price',
  'category',
  'image',
  'description',
  'owner',
  'featured',
  'tags',
  'allergens',
  'rating',
  'review_count',
  'sold_count',
  'is_available',
  'current_stock',
  'stock_history'
];

const rows = products.map((p) => {
  const stockHistory = p.stockHistory ?? [];
  const defaultOwner = 'Dapur Merifa';
  const line = [
    p.name,
    p.price,
    p.category ?? '',
    p.image ?? '',
    p.description ?? '',
    (p.owner && String(p.owner).trim()) ? p.owner : defaultOwner,
    Boolean(p.featured ?? false),
    toPgArray(p.tags ?? []),
    toPgArray(p.allergens ?? []),
    Number(p.rating ?? 0),
    Number(p.reviewCount ?? p.review_count ?? 0),
    Number(p.soldCount ?? p.sold_count ?? 0),
    Boolean(p.isAvailable ?? p.is_available ?? true),
    Number(p.currentStock ?? p.current_stock ?? 0),
    JSON.stringify(stockHistory)
  ];
  return line.map(csvEscape).join(',');
});

const csv = [headers.join(','), ...rows].join('\n');

const outPath = path.resolve(__dirname, '../docs/products_seed.csv');
await writeFile(outPath, csv, 'utf8');
console.log(`Wrote CSV: ${outPath}`);
