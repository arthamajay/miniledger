/**
 * utils/formatters.ts
 *
 * Pure helper functions for formatting data in the UI.
 * Keeping them here means we change date/currency format in one place.
 */

/**
 * formatCurrency
 * Formats a number as Indian Rupees.
 * e.g. 1500 → "₹1,500.00"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * formatDate
 * Converts "2024-06-15" to "15 Jun 2024"
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00'); // force local time
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * getDaysOverdue
 * Returns how many days a loan is past its due date.
 * Returns 0 if not overdue.
 */
export function getDaysOverdue(dueDateStr: string): number {
  const due = new Date(dueDateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = today.getTime() - due.getTime();
  return diff > 0 ? Math.floor(diff / (1000 * 60 * 60 * 24)) : 0;
}

/**
 * getDaysUntilDue
 * Returns days remaining until due date.
 * Returns 0 if already overdue.
 */
export function getDaysUntilDue(dueDateStr: string): number {
  const due = new Date(dueDateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = due.getTime() - today.getTime();
  return diff > 0 ? Math.floor(diff / (1000 * 60 * 60 * 24)) : 0;
}
