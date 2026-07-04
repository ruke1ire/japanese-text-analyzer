/**
 * Shared kanji-filter state — the single source of truth for what "the current
 * filters" mean. Both the Browse Kanji view and the Flashcards view own their
 * own state object of this shape and mutate it through applyFilterPatch(), so
 * the filter controls (renderBrowserControls) and the API query mapping work
 * identically for both without duplicating the reducer.
 */

export const DEFAULT_FILTER_STATE = {
    sort: 'frequency', jlpt: null, grade: null,
    strokesMin: null, strokesMax: null, radicals: [],
    readingRow: null, q: null, page: 1,
};

/**
 * Apply a control "patch" to a filter state and return the resulting state.
 * The patch vocabulary matches what renderBrowserControls emits via onChange:
 *   { clear: true }            -> reset to defaults
 *   { toggleRadical: glyph }   -> toggle a radical's membership
 *   { <key>: value, ... }      -> set fields directly (sort, jlpt, q, …)
 */
export function applyFilterPatch(state, patch) {
    if (patch.clear) {
        return { ...DEFAULT_FILTER_STATE };
    }
    if ('toggleRadical' in patch) {
        const set = new Set(state.radicals);
        set.has(patch.toggleRadical) ? set.delete(patch.toggleRadical) : set.add(patch.toggleRadical);
        return { ...state, radicals: [...set] };
    }
    return { ...state, ...patch };
}
