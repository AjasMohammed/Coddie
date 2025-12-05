/**
 * Utility functions for parsing test case inputs and outputs.
 * Converts string representations to appropriate JavaScript types.
 */

/**
 * Parse a string value into appropriate type (number, boolean, null, array, object, or string).
 */
export const parseValue = (str: string): any => {
    if (!str || !str.trim()) {
        return null;
    }

    const trimmed = str.trim();

    // Try JSON parsing first (handles arrays, objects, strings, numbers, booleans, null)
    try {
        return JSON.parse(trimmed);
    } catch {
        // If JSON parsing fails, try parsing as number, boolean, or null
        const lower = trimmed.toLowerCase();
        if (lower === "true") return true;
        if (lower === "false") return false;
        if (lower === "null") return null;
        const num = Number(trimmed);
        if (!isNaN(num) && trimmed !== "") return num;
        return trimmed; // Return as string if all else fails
    }
};

/**
 * Parse input string like "[2,7,11,15], 9" into a list [[2,7,11,15], 9].
 *
 * Rules:
 * - Items inside brackets [] or braces {} are treated as a single input
 * - Items outside brackets are treated as separate parameters
 * - Supports nested arrays and objects
 * - Always returns an array of parsed inputs
 *
 * Examples:
 * - "[1, 2, 3, 4]" -> [[1, 2, 3, 4]] (single array argument)
 * - "[1, 2, 3], 9" -> [[1, 2, 3], 9] (array and number as separate arguments)
 * - "[1, 2], [3, 4]" -> [[1, 2], [3, 4]] (two separate arrays)
 * - "[1, [2, 3], 4]" -> [[1, [2, 3], 4]] (nested array as single input)
 */
export const parseInputString = (inputStr: string): any[] => {
    if (!inputStr || !inputStr.trim()) {
        return [];
    }

    const trimmed = inputStr.trim();
    const parts: any[] = [];
    let depth = 0;
    let inQuotes = false;
    let quoteChar = "";
    let current = "";

    // Split by commas that are at depth 0 (outside brackets/quotes)
    for (let i = 0; i < trimmed.length; i++) {
        const char = trimmed[i];
        const prevChar = i > 0 ? trimmed[i - 1] : null;

        if (!inQuotes && (char === "[" || char === "{" || char === "(")) {
            depth++;
            current += char;
        } else if (
            !inQuotes &&
            (char === "]" || char === "}" || char === ")")
        ) {
            depth--;
            current += char;
        } else if (!inQuotes && (char === '"' || char === "'")) {
            inQuotes = true;
            quoteChar = char;
            current += char;
        } else if (inQuotes && char === quoteChar && prevChar !== "\\") {
            inQuotes = false;
            current += char;
        } else if (!inQuotes && char === "," && depth === 0) {
            // Comma at depth 0 means it's a separator between arguments
            if (current.trim()) {
                const parsedPart = parseValue(current.trim());
                parts.push(parsedPart);
            }
            current = "";
        } else {
            current += char;
        }
    }

    // Add the last part
    if (current.trim()) {
        const parsedPart = parseValue(current.trim());
        parts.push(parsedPart);
    }

    // Always return an array, even if empty or single item
    return parts.length > 0 ? parts : [];
};

/**
 * Parse output string into appropriate type.
 */
export const parseOutputString = (outputStr: string): any => {
    return parseValue(outputStr);
};

/**
 * Convert input array to string representation for display.
 * e.g., [[2,7,11,15], 9] -> "[2,7,11,15], 9"
 */
export const formatInputArray = (input: any[]): string => {
    if (!Array.isArray(input) || input.length === 0) {
        return "";
    }
    return input
        .map((item) => {
            if (Array.isArray(item) || typeof item === "object") {
                return JSON.stringify(item);
            } else if (typeof item === "string") {
                return `"${item}"`;
            }
            return String(item);
        })
        .join(", ");
};

/**
 * Convert output value to string representation for display.
 * e.g., [0,1] -> "[0,1]"
 */
export const formatOutputValue = (output: any): string => {
    if (output === null || output === undefined) {
        return "";
    }
    if (Array.isArray(output) || typeof output === "object") {
        return JSON.stringify(output);
    }
    return String(output);
};
