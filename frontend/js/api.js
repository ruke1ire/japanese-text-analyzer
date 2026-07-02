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

    async getKanjiList(params = {}) {
        // params: { sort, jlpt, grade, strokesMin, strokesMax, radicals: [],
        //           readingRow, q, page, pageSize }
        const qs = new URLSearchParams();
        if (params.sort) qs.set('sort', params.sort);
        if (params.jlpt != null) qs.set('jlpt', params.jlpt);
        if (params.grade != null) qs.set('grade', params.grade);
        if (params.strokesMin != null) qs.set('strokes_min', params.strokesMin);
        if (params.strokesMax != null) qs.set('strokes_max', params.strokesMax);
        if (params.readingRow) qs.set('reading_row', params.readingRow);
        if (params.q) qs.set('q', params.q);
        if (params.page != null) qs.set('page', params.page);
        if (params.pageSize != null) qs.set('page_size', params.pageSize);
        (params.radicals || []).forEach(r => qs.append('radical', r));

        const response = await fetch(`${this.baseURL}/kanji?${qs.toString()}`);
        if (!response.ok) {
            throw new Error(`Kanji list failed: ${response.statusText}`);
        }
        return await response.json();
    }

    async getRadicals() {
        const response = await fetch(`${this.baseURL}/radicals`);
        if (!response.ok) {
            throw new Error(`Radical list failed: ${response.statusText}`);
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
