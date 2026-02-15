/**
 * History sidebar component - displays analysis history
 */

/**
 * Render history entries in the sidebar
 * @param {Array} entries - Array of history entries
 * @param {HTMLElement} container - Container element to render into
 * @param {Object} options - Options object with onEntryClick and activeId
 */
export function renderHistory(entries, container, options = {}) {
    container.innerHTML = '';

    // Show empty state if no entries
    if (entries.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'history-empty';
        emptyState.textContent = 'No analysis history yet';
        container.appendChild(emptyState);
        return;
    }

    // Create entry element for each entry
    entries.forEach(entry => {
        const isActive = entry.id === options.activeId;
        const entryElement = createHistoryEntry(entry, isActive);

        // Attach click handler
        if (options.onEntryClick) {
            entryElement.addEventListener('click', () => {
                options.onEntryClick(entry);

                // Close sidebar on mobile
                if (window.innerWidth <= 640) {
                    const sidebar = document.getElementById('history-sidebar');
                    const overlay = document.getElementById('sidebar-overlay');
                    sidebar.classList.remove('mobile-visible');
                    overlay.classList.remove('visible');
                }
            });
        }

        container.appendChild(entryElement);
    });
}

/**
 * Create a single history entry element
 * @param {Object} entry - History entry object
 * @param {boolean} isActive - Whether this entry is currently active
 * @returns {HTMLElement} - The created entry element
 */
function createHistoryEntry(entry, isActive = false) {
    const entryDiv = document.createElement('div');
    entryDiv.className = 'history-entry';
    if (isActive) {
        entryDiv.classList.add('active');
    }

    // Create preview element
    const previewDiv = document.createElement('div');
    previewDiv.className = 'history-entry-preview';
    previewDiv.textContent = entry.preview;

    // Create timestamp element
    const timeDiv = document.createElement('div');
    timeDiv.className = 'history-entry-time';
    timeDiv.textContent = formatTimestamp(entry.timestamp);

    entryDiv.appendChild(previewDiv);
    entryDiv.appendChild(timeDiv);

    return entryDiv;
}

/**
 * Format timestamp into human-readable relative time
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} - Formatted time string
 */
export function formatTimestamp(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) {
        return 'Just now';
    } else if (minutes < 60) {
        return `${minutes} min${minutes !== 1 ? 's' : ''} ago`;
    } else if (hours < 24) {
        return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
        const date = new Date(timestamp);
        const dateStr = date.toLocaleDateString();
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `${dateStr} ${timeStr}`;
    }
}

/**
 * Generate preview text from full text
 * @param {string} text - Full text to generate preview from
 * @returns {string} - Preview text (max 50 characters)
 */
export function generatePreview(text) {
    // Clean whitespace and newlines
    const cleaned = text.replace(/\s+/g, ' ').trim();

    // Truncate to 50 characters
    if (cleaned.length <= 50) {
        return cleaned;
    }

    return cleaned.substring(0, 50) + '...';
}

/**
 * Setup history sidebar functionality (mobile overlay only)
 * @param {HTMLElement} sidebar - The sidebar element
 */
export function setupHistorySidebar(sidebar) {
    const toggleBtn = document.getElementById('history-toggle-btn');
    const overlay = document.getElementById('sidebar-overlay');

    // Mobile: Toggle button and overlay handlers
    if (toggleBtn && overlay) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('mobile-visible');
            overlay.classList.toggle('visible');
        });

        overlay.addEventListener('click', () => {
            sidebar.classList.remove('mobile-visible');
            overlay.classList.remove('visible');
        });
    }
}
