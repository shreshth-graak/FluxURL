document.addEventListener('DOMContentLoaded', function () {
    // --- DOM Elements ---
    const shortenForm = document.getElementById('shorten-form');
    const resultSection = document.getElementById('result-section');
    const errorSection = document.getElementById('error-section');
    const expiresAtInput = document.getElementById('expiresAt');

    const inspectForm = document.getElementById('inspect-form');
    const inspectUrlInput = document.getElementById('inspect-url-input');
    const inspectResultSection = document.getElementById('inspect-result-section');

    const urlListContainer = document.getElementById('url-list');

    const updateUrlModalEl = document.getElementById('updateUrlModal');
    const updateUrlModal = new bootstrap.Modal(updateUrlModalEl);
    const updateUrlForm = document.getElementById('update-url-form');
    const updateShortUrlInput = document.getElementById('update-short-url');
    const updateLongUrlInput = document.getElementById('update-long-url');
    const updateExpiresAtInput = document.getElementById('update-expires-at');

    // --- State ---
    // Local cache for URLs created in this session. No dummy data.
    let urls = [];

    // --- Reusable Functions ---

    /**
     * Formats a date string for display.
     * @param {string} dateString - The date string to format.
     * @returns {string} - Formatted date or 'N/A'.
     */
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    };

    /**
     * Creates the HTML for a detailed URL card.
     * @param {object} url - The UrlInfoDto object.
     * @returns {string} - The HTML string for the card.
     */
    const createUrlCard = (url) => {
        const fullShortUrl = `${window.location.origin}/${url.shortUrl}`;
        const statusColor = url.status === 'ACTIVE' ? 'text-success' : 'text-danger';
        return `
            <div class="url-card" id="card-${url.shortUrl}">
                <div class="row align-items-center">
                    <div class="col-lg-5 col-md-12 mb-3 mb-lg-0">
                        <a href="${fullShortUrl}" target="_blank" class="short-link d-block">${fullShortUrl}</a>
                        <p class="long-link mb-0 mt-1" title="${url.longUrl}">${url.longUrl}</p>
                    </div>
                    <div class="col-lg-5 col-md-8 row">
                        <div class="col-4 text-center" title="Status"><i class="bi bi-power ${statusColor}"></i> ${url.status}</div>
                        <div class="col-4 text-center" title="Clicks"><i class="bi bi-bar-chart-fill"></i> ${url.clickCount}</div>
                        <div class="col-4 text-center" title="Expires"><i class="bi bi-calendar-x"></i> ${formatDate(url.expiresAt)}</div>
                    </div>
                    <div class="col-lg-2 col-md-4 text-end">
                        <button class="btn btn-sm btn-outline-secondary me-2 edit-button" data-shorturl="${url.shortUrl}" title="Edit URL">
                            <i class="bi bi-pencil-square"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-button" data-shorturl="${url.shortUrl}" title="Delete URL">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    };

    /**
     * Renders the list of URLs from the local cache.
     */
    const renderUrlList = () => {
        urlListContainer.innerHTML = '';
        if (urls.length === 0) {
            urlListContainer.innerHTML = '<p class="text-center text-muted">No URLs created in this session yet.</p>';
            return;
        }
        urls.forEach(url => {
            urlListContainer.innerHTML += createUrlCard(url);
        });
    };

    const displayError = (message) => {
        errorSection.textContent = message;
        errorSection.style.display = 'block';
    };

    // --- Event Handlers ---

    // Handle Create URL
    shortenForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        resultSection.innerHTML = '';
        errorSection.style.display = 'none';

        const formData = new FormData(shortenForm);
        const data = {
            longUrl: formData.get('longUrl'),
            customAlias: formData.get('customAlias') || null,
            expiresAt: formData.get('expiresAt') || null
        };

        try {
            // 1. Create the short URL
            const createResponse = await fetch('/api/urls/shorten', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!createResponse.ok) throw new Error('Creation failed. The custom alias might be taken.');
            
            const { shortUrl } = await createResponse.json();

            // 2. Fetch the full info of the newly created URL
            const infoResponse = await fetch(`/api/urls/info/${shortUrl}`);
            if (!infoResponse.ok) throw new Error('Could not fetch details for the new URL.');

            const newUrlInfo = await infoResponse.json();

            // 3. Add to cache, render, and display
            urls.unshift(newUrlInfo);
            renderUrlList();
            resultSection.innerHTML = createUrlCard(newUrlInfo);
            shortenForm.reset();

        } catch (error) {
            displayError(error.message);
        }
    });

    // Handle Inspect URL
    inspectForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const searchTerm = inspectUrlInput.value.trim();
        inspectResultSection.innerHTML = '';

        try {
            const response = await fetch(`/api/urls/info/${searchTerm}`);
            if (!response.ok) throw new Error('URL not found.');
            const urlInfo = await response.json();
            inspectResultSection.innerHTML = createUrlCard(urlInfo);
        } catch (error) {
            inspectResultSection.innerHTML = `<div class="result-card text-center text-muted">${error.message}</div>`;
        }
    });

    // Handle Edit and Delete buttons
    document.body.addEventListener('click', function(e) {
        const button = e.target.closest('.delete-button, .edit-button');
        if (!button) return;

        const shortUrl = button.dataset.shorturl;

        // Handle Delete
        if (button.classList.contains('delete-button')) {
            if (confirm(`Are you sure you want to delete the URL for "${shortUrl}"?`)) {
                fetch(`/api/urls/${shortUrl}`, { method: 'DELETE' })
                    .then(response => {
                        if (response.ok) {
                            urls = urls.filter(url => url.shortUrl !== shortUrl);
                            renderUrlList();
                        } else {
                            alert('Failed to delete URL.');
                        }
                    });
            }
        }

        // Handle Edit
        if (button.classList.contains('edit-button')) {
            const urlToUpdate = urls.find(url => url.shortUrl === shortUrl);
            if (urlToUpdate) {
                updateShortUrlInput.value = urlToUpdate.shortUrl;
                updateLongUrlInput.value = urlToUpdate.longUrl;
                updateExpiresAtInput.value = urlToUpdate.expiresAt ? urlToUpdate.expiresAt.split('T')[0] : '';
                updateUrlModal.show();
            }
        }
    });

    // Handle Update URL Form Submission
    updateUrlForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const shortUrl = updateShortUrlInput.value;
        
        const payload = {};
        if (updateLongUrlInput.value) payload.longUrl = updateLongUrlInput.value;
        if (updateExpiresAtInput.value) payload.expiresAt = updateExpiresAtInput.value;

        if (Object.keys(payload).length === 0) {
            alert('Please change at least one field.');
            return;
        }

        try {
            const response = await fetch(`/api/urls/${shortUrl}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Failed to update URL.');

            const updatedUrl = await response.json();
            const index = urls.findIndex(url => url.shortUrl === shortUrl);
            if (index !== -1) {
                urls[index] = updatedUrl;
            }
            renderUrlList();
            updateUrlModal.hide();
        } catch (error) {
            alert(error.message);
        }
    });

    // --- Initial Setup ---
    const setMinDate = (input) => {
        input.min = new Date().toISOString().split("T")[0];
    };
    setMinDate(expiresAtInput);
    setMinDate(updateExpiresAtInput);
    renderUrlList();
});
