/**
 * API client for Japanese Text Analyzer backend
 */

const API_BASE_URL = 'http://localhost:8000/api';

export class JapaneseAnalyzerAPI {
    constructor(baseURL = API_BASE_URL) {
        this.baseURL = baseURL;
    }

    async analyzeText(text) {
        const response = await fetch(`${this.baseURL}/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text }),
        });

        if (!response.ok) {
            throw new Error(`Analysis failed: ${response.statusText}`);
        }

        return await response.json();
    }

    async getWordDefinition(word) {
        const response = await fetch(
            `${this.baseURL}/word/${encodeURIComponent(word)}`
        );

        if (!response.ok) {
            if (response.status === 404) {
                return null;
            }
            throw new Error(`Word lookup failed: ${response.statusText}`);
        }

        return await response.json();
    }

    async getKanjiInfo(character) {
        const response = await fetch(
            `${this.baseURL}/kanji/${encodeURIComponent(character)}`
        );

        if (!response.ok) {
            if (response.status === 404) {
                return null;
            }
            throw new Error(`Kanji lookup failed: ${response.statusText}`);
        }

        return await response.json();
    }

    async getKanjiVocabulary(character, limit = 20) {
        const response = await fetch(
            `${this.baseURL}/kanji/${encodeURIComponent(character)}/vocabulary?limit=${limit}`
        );

        if (!response.ok) {
            throw new Error(`Kanji vocabulary lookup failed: ${response.statusText}`);
        }

        return await response.json();
    }

    async getKanjiExamples(character, limit = 6) {
        const response = await fetch(
            `${this.baseURL}/kanji/${encodeURIComponent(character)}/examples?limit=${limit}`
        );

        if (!response.ok) {
            throw new Error(`Kanji examples lookup failed: ${response.statusText}`);
        }

        return await response.json();
    }

    async getKanjiRadicals(character) {
        const response = await fetch(
            `${this.baseURL}/kanji/${encodeURIComponent(character)}/radicals`
        );

        if (!response.ok) {
            throw new Error(`Kanji radicals lookup failed: ${response.statusText}`);
        }

        return await response.json();
    }

    async getRadicalDetail(character) {
        const response = await fetch(
            `${this.baseURL}/radical/${encodeURIComponent(character)}`
        );

        if (!response.ok) {
            if (response.status === 404) {
                return null;
            }
            throw new Error(`Radical lookup failed: ${response.statusText}`);
        }

        return await response.json();
    }

    async translateText(text, source = 'ja', target = 'en', method = null) {
        const body = { text, source, target };
        if (method) {
            body.method = method;
        }

        const response = await fetch(`${this.baseURL}/translate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error(`Translation failed: ${response.statusText}`);
        }

        return await response.json();
    }

    async healthCheck() {
        const response = await fetch(`${this.baseURL}/health`);

        if (!response.ok) {
            throw new Error(`Health check failed: ${response.statusText}`);
        }

        return await response.json();
    }
}
