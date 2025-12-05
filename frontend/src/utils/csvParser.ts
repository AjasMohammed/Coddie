/**
 * Utility functions for parsing CSV files containing test cases.
 * CSV format: First row should be headers (input,output), subsequent rows contain test case data.
 */

export interface ParsedTestCase {
    input: string;
    output: string;
}

/**
 * Parse CSV file content into test cases.
 * Expected format:
 * - First row: headers (input,output) - case insensitive
 * - Subsequent rows: test case data
 *
 * Handles quoted values and commas within quoted strings.
 */
export const parseCSV = (csvContent: string): ParsedTestCase[] => {
    const lines = csvContent.split(/\r?\n/).filter((line) => line.trim());

    if (lines.length < 2) {
        throw new Error("CSV file must contain at least a header row and one data row");
    }

    // Parse header row
    const headerLine = lines[0].trim();
    const headers = parseCSVLine(headerLine);

    // Normalize headers to lowercase for comparison
    const normalizedHeaders = headers.map((h) => h.toLowerCase().trim());

    // Find input and output column indices
    const inputIndex = normalizedHeaders.findIndex((h) => h === "input");
    const outputIndex = normalizedHeaders.findIndex((h) => h === "output");

    if (inputIndex === -1 || outputIndex === -1) {
        throw new Error(
            "CSV file must contain 'input' and 'output' columns. " +
            "Found columns: " + headers.join(", ")
        );
    }

    // Parse data rows
    const testCases: ParsedTestCase[] = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue; // Skip empty lines

        const values = parseCSVLine(line);

        if (values.length <= Math.max(inputIndex, outputIndex)) {
            throw new Error(
                `Row ${i + 1} does not have enough columns. ` +
                `Expected at least ${Math.max(inputIndex, outputIndex) + 1} columns, ` +
                `found ${values.length}`
            );
        }

        testCases.push({
            input: values[inputIndex].trim(),
            output: values[outputIndex].trim(),
        });
    }

    return testCases;
};

/**
 * Parse a single CSV line, handling quoted values and escaped quotes.
 */
const parseCSVLine = (line: string): string[] => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
        const char = line[i];
        const nextChar = i + 1 < line.length ? line[i + 1] : null;

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                // Escaped quote
                current += '"';
                i += 2;
            } else if (inQuotes && (nextChar === "," || nextChar === null || nextChar === "\n" || nextChar === "\r")) {
                // End of quoted value
                inQuotes = false;
                i++;
            } else if (!inQuotes) {
                // Start of quoted value
                inQuotes = true;
                i++;
            } else {
                current += char;
                i++;
            }
        } else if (char === "," && !inQuotes) {
            // Field separator
            values.push(current);
            current = "";
            i++;
        } else {
            current += char;
            i++;
        }
    }

    // Add the last value
    values.push(current);

    return values;
};

/**
 * Read CSV file and parse it into test cases.
 */
export const readCSVFile = async (file: File): Promise<ParsedTestCase[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const testCases = parseCSV(content);
                resolve(testCases);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => {
            reject(new Error("Failed to read CSV file"));
        };

        reader.readAsText(file);
    });
};

