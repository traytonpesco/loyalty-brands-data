import ExcelJS from 'exceljs';
const { Parser } = require('json2csv');
import * as xml2js from 'xml2js';

export type ExportFormat = 'csv' | 'excel' | 'json' | 'xml';

interface ExportColumn {
  key: string;
  label: string;
}

/**
 * Export data to CSV format
 */
export async function exportToCSV(data: any[], columns: ExportColumn[]): Promise<Buffer> {
  try {
    const fields = columns.map(col => ({
      label: col.label,
      value: col.key
    }));

    const parser = new Parser({ fields });
    const csv = parser.parse(data);
    return Buffer.from(csv, 'utf-8');
  } catch (error: any) {
    throw new Error(`CSV export failed: ${error.message}`);
  }
}

/**
 * Export data to Excel format
 */
export async function exportToExcel(
  data: any[],
  columns: ExportColumn[],
  sheetName: string = 'Sheet1'
): Promise<Buffer> {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    // Add header row with styling
    const headers = columns.map(col => col.label);
    worksheet.addRow(headers);
    
    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Add data rows
    data.forEach(item => {
      const row = columns.map(col => {
        const value = item[col.key];
        // Handle dates
        if (value instanceof Date) {
          return value;
        }
        // Handle null/undefined
        if (value === null || value === undefined) {
          return '';
        }
        return value;
      });
      worksheet.addRow(row);
    });

    // Auto-size columns
    worksheet.columns.forEach((column, index) => {
      let maxLength = headers[index]?.length || 10;
      column.eachCell?.({ includeEmpty: false }, (cell) => {
        const cellValue = cell.value?.toString() || '';
        maxLength = Math.max(maxLength, cellValue.length);
      });
      column.width = Math.min(maxLength + 2, 50); // Cap at 50
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  } catch (error: any) {
    throw new Error(`Excel export failed: ${error.message}`);
  }
}

/**
 * Export data to JSON format
 */
export async function exportToJSON(data: any[]): Promise<Buffer> {
  try {
    const json = JSON.stringify(data, null, 2);
    return Buffer.from(json, 'utf-8');
  } catch (error: any) {
    throw new Error(`JSON export failed: ${error.message}`);
  }
}

/**
 * Export data to XML format
 */
export async function exportToXML(data: any[], rootElement: string = 'data'): Promise<Buffer> {
  try {
    const builder = new xml2js.Builder({
      rootName: rootElement,
      headless: false,
      renderOpts: { pretty: true, indent: '  ' }
    });
    
    const xmlObj = {
      item: data
    };
    
    const xml = builder.buildObject(xmlObj);
    return Buffer.from(xml, 'utf-8');
  } catch (error: any) {
    throw new Error(`XML export failed: ${error.message}`);
  }
}

/**
 * Get content type for format
 */
export function getContentType(format: ExportFormat): string {
  const contentTypes = {
    csv: 'text/csv',
    excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    json: 'application/json',
    xml: 'application/xml'
  };
  return contentTypes[format];
}

/**
 * Get file extension for format
 */
export function getFileExtension(format: ExportFormat): string {
  const extensions = {
    csv: 'csv',
    excel: 'xlsx',
    json: 'json',
    xml: 'xml'
  };
  return extensions[format];
}

/**
 * Main export function that handles all formats
 */
export async function exportData(
  data: any[],
  format: ExportFormat,
  columns: ExportColumn[],
  options: { sheetName?: string; rootElement?: string } = {}
): Promise<Buffer> {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  switch (format) {
    case 'csv':
      return exportToCSV(data, columns);
    case 'excel':
      return exportToExcel(data, columns, options.sheetName || 'Sheet1');
    case 'json':
      return exportToJSON(data);
    case 'xml':
      return exportToXML(data, options.rootElement || 'data');
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

