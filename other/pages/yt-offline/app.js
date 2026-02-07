const CACHE_NAME = 'video-cache-v1'; // Name your cache
const videoUrlInput = document.getElementById('videoUrlInput');
const cacheButton = document.getElementById('cacheButton');
const playButton = document.getElementById('playButton');
const clearCacheButton = document.getElementById('clearCacheButton');
const videoPlayer = document.getElementById('videoPlayer');
const statusDiv = document.getElementById('status');

let cachedVideoUrl = null; // Store the URL of the video that was successfully cached

// --- Service Worker Registration ---
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(registration => {
            console.log('Service Worker registered with scope:', registration.scope);
            checkCachedVideoStatus(); // Check if a video is already cached on load
        })
        .catch(error => {
            console.error('Service Worker registration failed:', error);
            updateStatus(`Error: Service Worker registration failed. (${error.message})`, true);
        });
} else {
    updateStatus('Error: Your browser does not support Service Workers. Offline features will not work.', true);
    cacheButton.disabled = true;
    playButton.disabled = true;
    clearCacheButton.disabled = true;
}

// --- Helper for updating status messages ---
function updateStatus(message, isError = false) {
    statusDiv.textContent = message;
    if (isError) {
        statusDiv.classList.add('error');
    } else {
        statusDiv.classList.remove('error');
    }
}

// --- Check if a video is already in cache when the page loads ---
async function checkCachedVideoStatus() {
    try {
        const cache = await caches.open(CACHE_NAME);
        const keys = await cache.keys();
        if (keys.length > 0) {
            // Assuming we only cache one main video for simplicity for this demo
            cachedVideoUrl = keys[0].url;
            updateStatus(`A video is already cached: ${cachedVideoUrl}.`);
            playButton.disabled = false;
        } else {
            updateStatus('No video currently cached.');
            playButton.disabled = true;
        }
    } catch (error) {
        console.error('Failed to check cache:', error);
        updateStatus(`Failed to check cache status. (${error.message})`, true);
        playButton.disabled = true;
    }
}


// --- Event Listener: Cache Video ---
cacheButton.addEventListener('click', async () => {
    const url = videoUrlInput.value.trim();

    if (!url) {
        updateStatus('Please enter a video URL.', true);
        return;
    }

    // Basic check for YouTube/Vimeo (not exhaustive, but good for user guidance)
    if (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com')) {
        updateStatus('Cannot cache YouTube/Vimeo links. Please provide a direct video file URL (e.g., .mp4).', true);
        return;
    }

    updateStatus(`Attempting to cache: ${url}... This may take a while for large files.`);
    cacheButton.disabled = true;
    playButton.disabled = true;

    try {
        const cache = await caches.open(CACHE_NAME);

        // Clear existing cache for this demo, so we only have one video at a time
        const keys = await cache.keys();
        await Promise.all(keys.map(request => cache.delete(request)));

        // Fetch and add the video to the cache
        await cache.add(url);
        cachedVideoUrl = url;
        updateStatus(`Video cached successfully! Size: (check browser dev tools > Application > Cache Storage)`);
        playButton.disabled = false;
        videoPlayer.src = ''; // Clear player if something was playing
        videoPlayer.load(); // Make sure player recognizes src change
    } catch (error) {
        console.error('Failed to cache video:', error);
        updateStatus(`Failed to cache video: ${error.message}. Make sure it's a direct video file link and accessible.`, true);
        cachedVideoUrl = null;
    } finally {
        cacheButton.disabled = false;
    }
});

// --- Event Listener: Play Cached Video ---
playButton.addEventListener('click', () => {
    if (cachedVideoUrl) {
        videoPlayer.src = cachedVideoUrl;
        videoPlayer.play()
            .then(() => {
                updateStatus(`Playing cached video: ${cachedVideoUrl}`);
            })
            .catch(error => {
                updateStatus(`Error playing video: ${error.message}. Try reloading or clearing cache.`, true);
                console.error('Video playback error:', error);
            });
    } else {
        updateStatus('No video cached. Please cache a video first.', true);
    }
});

// --- Event Listener: Clear Cache ---
clearCacheButton.addEventListener('click', async () => {
    updateStatus('Clearing video cache...');
    try {
        const cache = await caches.open(CACHE_NAME);
        const keys = await cache.keys();
        await Promise.all(keys.map(request => cache.delete(request)));
        cachedVideoUrl = null;
        updateStatus('Video cache cleared successfully!');
        playButton.disabled = true;
        videoPlayer.src = ''; // Clear the player
        videoPlayer.load();
    } catch (error) {
        console.error('Failed to clear cache:', error);
        updateStatus(`Failed to clear cache: ${error.message}`, true);
    }
});

// --- Default value for testing ---
// This is a sample MP4 file from learningcontainer.com
// videoUrlInput.value = 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4';