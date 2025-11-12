document.addEventListener('DOMContentLoaded', function () {
    // --- DOM Elements ---
    const shortenForm = document.getElementById('shorten-form');
    const resultSection = document.getElementById('result-section');
    const errorSection = document.getElementById('error-section');
    const expiresAtInput = document.getElementById('expiresAt');

    const inspectForm = document.getElementById('inspect-form');
    const inspectUrlInput = document.getElementById('inspect-url-input');
    const inspectResultSection = document.getElementById('inspect-result-section');

    const unshortenForm = document.getElementById('unshorten-form');
    const unshortenUrlInput = document.getElementById('unshorten-url-input');
    const unshortenResultSection = document.getElementById('unshorten-result-section');

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
        // The DTO provides the full short URL, no need to construct it.
        const fullShortUrl = url.shortUrl;
        const statusColor = url.status.toLowerCase() === 'active' ? 'text-success' : 'text-danger';
        const shortCode = fullShortUrl.split('/').pop();
        return `
            <div class="url-card" id="card-${shortCode}">
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
                        <button class="btn btn-sm btn-outline-secondary me-1 copy-button" data-shorturl="${fullShortUrl}" title="Copy Link">
                            <i class="bi bi-clipboard"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-info me-1 edit-button" data-shorturl="${shortCode}" title="Edit URL">
                            <i class="bi bi-pencil-square"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-button" data-shorturl="${shortCode}" title="Delete URL">
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
        // Sort by creation date descending
        urls.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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
            // 1. Create the short URL, backend returns just the code
            const createResponse = await fetch('/api/urls/shorten', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!createResponse.ok) {
                 const errorData = await createResponse.json().catch(() => ({ message: 'Creation failed. The custom alias might be taken or the input is invalid.' }));
                 throw new Error(errorData.message || 'An unknown error occurred.');
            }
            
            const { shortUrl } = await createResponse.json(); // This is now just the code, e.g., "abcdef"
            console.log('Short URL code received:', shortUrl);
            // 2. Fetch the full info of the newly created URL using the code
            const infoResponse = await fetch(`/api/urls/info?url=${encodeURIComponent(shortUrl)}`);
            if (!infoResponse.ok) throw new Error('Could not fetch details for the new URL.');

            const newUrlInfo = await infoResponse.json();

            // 3. Add to cache, render, and display the result prominently
            urls.unshift(newUrlInfo);
            renderUrlList(); // Update the main list
            resultSection.innerHTML = createUrlCard(newUrlInfo); // Show the new card at the top
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

        if (!searchTerm) {
            inspectResultSection.innerHTML = `<div class="result-card text-center text-muted">Please enter a URL or code to inspect.</div>`;
            return;
        }

        try {
            const response = await fetch(`/api/urls/info?url=${encodeURIComponent(searchTerm)}`);
            if (!response.ok) throw new Error('URL not found.');
            
            const urlInfo = await response.json();
            inspectResultSection.innerHTML = createUrlCard(urlInfo);

            // Add to local cache if it's not already there, so "Edit" works.
            const shortCode = urlInfo.shortUrl.split('/').pop();
            const existsInCache = urls.some(url => url.shortUrl.split('/').pop() === shortCode);
            if (!existsInCache) {
                urls.unshift(urlInfo);
                renderUrlList(); // re-render the main list to include the inspected URL
            }

        } catch (error) {
            inspectResultSection.innerHTML = `<div class="result-card text-center text-danger">${error.message}</div>`;
        }
    });

    // Handle Unshorten URL
    unshortenForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const shortUrl = unshortenUrlInput.value.trim();
        unshortenResultSection.innerHTML = '';

        if (!shortUrl) {
            unshortenResultSection.innerHTML = `<div class="result-card text-center text-muted">Please enter a short URL to unshorten.</div>`;
            return;
        }

        try {
            const response = await fetch(`/api/urls/getLongUrl?shortUrl=${encodeURIComponent(shortUrl)}`);
            if (!response.ok) {
                const errorText = await response.text();
                console.log('Fetching long URL for short URL:', shortUrl);
                throw new Error(errorText || 'Short URL not found or invalid.');
            }
            
            const longUrl = await response.text();
            unshortenResultSection.innerHTML = `
                <div class="result-card mt-3">
                    <p class="mb-1">Original URL:</p>
                    <a href="${longUrl}" target="_blank" class="long-link d-block">${longUrl}</a>
                </div>
            `;
        } catch (error) {
            unshortenResultSection.innerHTML = `<div class="result-card text-center text-danger">${error.message}</div>`;
        }
    });

    // Handle Edit, Delete, and Copy buttons
    document.body.addEventListener('click', function(e) {
        const button = e.target.closest('.delete-button, .edit-button, .copy-button');
        if (!button) return;

        const shortUrlData = button.dataset.shorturl;

        // Handle Delete
        if (button.classList.contains('delete-button')) {
            const shortUrlCode = shortUrlData;
            if (confirm(`Are you sure you want to delete the URL for "${shortUrlCode}"?`)) {
                fetch(`/api/urls/${shortUrlCode}`, { method: 'DELETE' })
                    .then(response => {
                        if (response.ok) {
                            // Remove from local cache and re-render main list
                            urls = urls.filter(url => url.shortUrl.split('/').pop() !== shortUrlCode);
                            renderUrlList();

                            // Also remove the card from the single result sections if it's there
                            const cardInResult = document.querySelector(`#result-section #card-${shortUrlCode}`);
                            if (cardInResult) cardInResult.remove();
                            
                            const cardInInspect = document.querySelector(`#inspect-result-section #card-${shortUrlCode}`);
                            if (cardInInspect) cardInInspect.remove();

                        } else {
                            alert('Failed to delete URL.');
                        }
                    });
            }
        }

        // Handle Edit
        if (button.classList.contains('edit-button')) {
            const shortUrlCode = shortUrlData;
            const urlToUpdate = urls.find(url => url.shortUrl.split('/').pop() === shortUrlCode);
            if (urlToUpdate) {
                updateShortUrlInput.value = shortUrlCode;
                updateLongUrlInput.value = urlToUpdate.longUrl;
                updateExpiresAtInput.value = urlToUpdate.expiresAt ? urlToUpdate.expiresAt.split('T')[0] : '';
                updateUrlModal.show();
            } else {
                alert('Could not find URL details to edit. Please inspect the URL again.');
            }
        }

        // Handle Copy
        if (button.classList.contains('copy-button')) {
            const fullUrl = shortUrlData;
            navigator.clipboard.writeText(fullUrl).then(() => {
                const originalIcon = button.innerHTML;
                button.innerHTML = `<i class="bi bi-check-lg"></i>`;
                setTimeout(() => {
                    button.innerHTML = originalIcon;
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy: ', err);
                alert('Failed to copy URL.');
            });
        }
    });

    // Handle Update URL Form Submission
    updateUrlForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const shortUrlCode = updateShortUrlInput.value;
        
        const payload = {};
        // Only add properties to the payload if they have a value
        const newLongUrl = updateLongUrlInput.value.trim();
        const newExpiresAt = updateExpiresAtInput.value;

        if (newLongUrl) payload.longUrl = newLongUrl;
        if (newExpiresAt) payload.expiresAt = newExpiresAt;

        if (Object.keys(payload).length === 0) {
            alert('Please change at least one field.');
            return;
        }

        try {
            const response = await fetch(`/api/urls/${shortUrlCode}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to update URL. Please check your input.' }));
                throw new Error(errorData.message || 'An unknown error occurred during update.');
            }

            const updatedUrl = await response.json();
            
            // Update the URL in the local cache
            const index = urls.findIndex(url => url.shortUrl.split('/').pop() === shortUrlCode);
            if (index !== -1) {
                urls[index] = updatedUrl;
            } else {
                // If not in the main list, maybe it was just inspected
                urls.unshift(updatedUrl);
            }

            renderUrlList(); // Re-render the main list
            updateUrlModal.hide();

            // If the updated card is visible in the single-result sections, update it there too
             const cardInResult = document.querySelector(`#result-section #card-${shortUrlCode}`);
             if (cardInResult) cardInResult.outerHTML = createUrlCard(updatedUrl);
             
             const cardInInspect = document.querySelector(`#inspect-result-section #card-${shortUrlCode}`);
             if (cardInInspect) cardInInspect.outerHTML = createUrlCard(updatedUrl);

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
