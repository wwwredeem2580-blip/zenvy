import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | undefined): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function formatRelativeTime(date: string | Date | undefined): string {
  if (!date) return '';
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  return formatDate(date);
}

export function formatTime(date: string | Date | undefined): string {
  if (!date) return '';
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })
}


export function cleanText(text: string | undefined): string {
  if (!text) return '';
  // 1. Strip HTML tags
  let clean = text.replace(/<[^>]*>?/gm, '');
  // 2. Decode common HTML entities
  clean = clean
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  // 3. Normalize Unicode mathematical alphanumeric symbols
  //    These are bold/italic/bold-italic variants that come from Google Docs,
  //    Word, and Unicode-based "font" tricks on social media / rich text editors.
  const ranges: [number, number, number][] = [
    // [rangeStart, rangeEnd, baseCharCode]
    [0x1D400, 0x1D419, 65],  // Bold Uppercase A-Z
    [0x1D41A, 0x1D433, 97],  // Bold Lowercase a-z
    [0x1D434, 0x1D44D, 65],  // Italic Uppercase A-Z
    [0x1D44E, 0x1D467, 97],  // Italic Lowercase a-z
    [0x1D468, 0x1D481, 65],  // Bold Italic Uppercase A-Z
    [0x1D482, 0x1D49B, 97],  // Bold Italic Lowercase a-z
    [0x1D5D4, 0x1D5ED, 65],  // Sans-serif Bold Uppercase A-Z
    [0x1D5EE, 0x1D607, 97],  // Sans-serif Bold Lowercase a-z
    [0x1D608, 0x1D621, 65],  // Sans-serif Bold Italic Uppercase A-Z
    [0x1D622, 0x1D63B, 97],  // Sans-serif Bold Italic Lowercase a-z
    [0x1D7CE, 0x1D7D7, 48],  // Mathematical Bold Digits 0-9
    [0x1D7D8, 0x1D7E1, 48],  // Mathematical Double-struck Digits 0-9
    [0x1D7E2, 0x1D7EB, 48],  // Mathematical Sans-serif Digits 0-9
    [0x1D7EC, 0x1D7F5, 48],  // Mathematical Sans-serif Bold Digits 0-9
    [0x1D7F6, 0x1D7FF, 48],  // Mathematical Monospace Digits 0-9
  ];
  // Use Array.from to properly handle surrogate pairs
  const chars = Array.from(clean);
  const normalized = chars.map((char) => {
    const cp = char.codePointAt(0) ?? 0;
    for (const [start, end, base] of ranges) {
      if (cp >= start && cp <= end) {
        return String.fromCharCode(base + (cp - start));
      }
    }
    return char;
  });
  return normalized.join('');
}
