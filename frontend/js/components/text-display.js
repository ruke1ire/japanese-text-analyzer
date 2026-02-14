/**
 * Text display component - renders analyzed text with furigana
 */

export function renderAnalyzedText(tokens, container, originalText) {
    container.innerHTML = '';

    // If no tokens, just display original text
    if (tokens.length === 0) {
        container.textContent = originalText;
        return;
    }

    let currentPosition = 0;

    tokens.forEach((token, index) => {
        // Add any text/whitespace before this token
        if (token.start > currentPosition) {
            const gap = originalText.substring(currentPosition, token.start);
            const textNode = document.createTextNode(gap);
            container.appendChild(textNode);
        }

        // Add the token element
        const tokenElement = createTokenElement(token, index);
        container.appendChild(tokenElement);

        // Update current position
        currentPosition = token.end;
    });

    // Add any remaining text after the last token
    if (currentPosition < originalText.length) {
        const trailing = originalText.substring(currentPosition);
        const textNode = document.createTextNode(trailing);
        container.appendChild(textNode);
    }
}

function createTokenElement(token, index) {
    // Check if token needs furigana (has kanji and different reading)
    const needsFurigana = hasKanji(token.surface) && token.surface !== token.reading;

    if (needsFurigana) {
        const ruby = document.createElement('ruby');
        ruby.className = 'token';
        ruby.dataset.index = index;
        ruby.dataset.surface = token.surface;
        ruby.dataset.baseForm = token.base_form;
        ruby.dataset.pos = token.pos;

        // Add base text wrapped in rb element
        const rb = document.createElement('rb');
        rb.textContent = token.surface;
        ruby.appendChild(rb);

        // Add ruby text (furigana)
        const rt = document.createElement('rt');
        rt.textContent = token.reading;
        ruby.appendChild(rt);

        return ruby;
    } else {
        const span = document.createElement('span');
        span.className = 'token';
        span.dataset.index = index;
        span.dataset.surface = token.surface;
        span.dataset.baseForm = token.base_form;
        span.dataset.pos = token.pos;
        span.textContent = token.surface;
        return span;
    }
}

function hasKanji(text) {
    // Check if text contains kanji characters (U+4E00 to U+9FAF)
    return /[\u4e00-\u9faf]/.test(text);
}

export function attachTokenClickHandlers(container, onTokenClick) {
    container.addEventListener('click', (event) => {
        const token = event.target.closest('.token');
        if (token) {
            const index = parseInt(token.dataset.index);
            const surface = token.dataset.surface;
            const baseForm = token.dataset.baseForm;
            const pos = token.dataset.pos;

            onTokenClick({ index, surface, baseForm, pos });
        }
    });
}
