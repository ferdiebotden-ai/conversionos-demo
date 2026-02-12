/**
 * Sage 50-Compatible CSV Export
 * Generates CSV format importable by Sage 50 Canada
 * [DEV-081]
 */

import type { Invoice, QuoteLineItem } from '@/types/database';

const HST_TAX_CODE = 'H';
const NOMINAL_CODE = '4000'; // Revenue account
const HST_RATE = '13.00';

function escapeField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatAmount(amount: number): string {
  return amount.toFixed(2);
}

function formatDate(dateStr: string): string {
  // Sage 50 expects YYYY-MM-DD
  return dateStr.split('T')[0] || dateStr;
}

/**
 * Generate Sage 50-compatible CSV from invoices
 * Each line item = separate row; HST on separate row per invoice
 */
export function generateSageCsv(invoices: Invoice[]): string {
  const headers = [
    'Invoice Date',
    'Invoice Number',
    'Customer Name',
    'Description',
    'Net Amount',
    'Tax Rate',
    'Tax Code',
    'Tax Amount',
    'Total Amount',
    'Nominal Code',
    'Due Date',
  ];

  const rows: string[][] = [];

  for (const invoice of invoices) {
    const lineItems = (invoice.line_items as unknown as QuoteLineItem[]) || [];
    const invoiceDate = formatDate(invoice.issue_date);
    const dueDate = formatDate(invoice.due_date);

    // Line item rows
    for (const item of lineItems) {
      rows.push([
        invoiceDate,
        invoice.invoice_number,
        escapeField(invoice.customer_name),
        escapeField(item.description),
        formatAmount(item.total),
        '',
        '',
        '',
        formatAmount(item.total),
        NOMINAL_CODE,
        dueDate,
      ]);
    }

    // Contingency row (if any)
    if (Number(invoice.contingency_amount) > 0) {
      rows.push([
        invoiceDate,
        invoice.invoice_number,
        escapeField(invoice.customer_name),
        escapeField(`Contingency (${invoice.contingency_percent}%)`),
        formatAmount(Number(invoice.contingency_amount)),
        '',
        '',
        '',
        formatAmount(Number(invoice.contingency_amount)),
        NOMINAL_CODE,
        dueDate,
      ]);
    }

    // HST row
    rows.push([
      invoiceDate,
      invoice.invoice_number,
      escapeField(invoice.customer_name),
      'HST 13%',
      '',
      HST_RATE,
      HST_TAX_CODE,
      formatAmount(Number(invoice.hst_amount)),
      formatAmount(Number(invoice.hst_amount)),
      '',
      dueDate,
    ]);
  }

  // Build CSV with UTF-8 BOM for Excel compatibility
  const bom = '\uFEFF';
  const headerLine = headers.join(',');
  const dataLines = rows.map(row => row.join(','));

  return bom + [headerLine, ...dataLines].join('\n');
}
