document.addEventListener('DOMContentLoaded', async function() {
    const searchInput = document.getElementById('search');
    const resultsText = document.getElementById('results-text');
    const resultsContainer = document.querySelector('.results-container');
    const channelCount = document.getElementById('channel-count');
    const body = document.body;

    // Fetch the number of folders in yt_data and display it
    const baseUrl = 'yt_data/';
    const response = await fetch(baseUrl);
    const text = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    const folders = Array.from(doc.querySelectorAll('a'))
        .map(a => a.href.split('/').pop())
        .filter(name => name && !name.includes('.')); // Filter out non-folder links
    channelCount.textContent = `Channels saved: ${folders.length - 1}`; // Subtract 1 from the count

    searchInput.addEventListener('focus', function() {
        this.placeholder = '';
        body.classList.add('blurred');
        this.classList.remove('blurred');
        resultsContainer.classList.remove('blurred');
    });

    searchInput.addEventListener('blur', function() {
        if (this.value === '') {
            this.placeholder = 'Search...';
            body.classList.remove('blurred');
            resultsContainer.classList.remove('visible');
        }
    });

    searchInput.addEventListener('input', function() {
        if (this.value !== '') {
            resultsText.textContent = `Results for: ${this.value}`;
            searchYtData(this.value);
            resultsContainer.classList.add('visible');
        } else {
            resultsContainer.classList.remove('visible');
        }
    });

    async function searchYtData(query) {
        const results = [];
    
        for (const folder of folders) {
            if (folder.toLowerCase().startsWith(query.toLowerCase())) {
                const channelInfo = await fetch(`${baseUrl}${folder}/${folder}_channel_info.txt`).then(res => res.text());
                const videoDetails = await fetch(`${baseUrl}${folder}/${folder}_video_details.txt`).then(res => res.text());
    
                const saveDateMatch = channelInfo.match(/Data saved on: (.+)/);
                const videoCountMatch = channelInfo.match(/Number of cached videos: (\d+)/);
                const channelNameMatch = channelInfo.match(/Channel Name: (.+)/);
    
                results.push({
                    channelId: folder,
                    channelName: channelNameMatch ? channelNameMatch[1] : 'Unknown',
                    downloadLink: `${baseUrl}${folder}.zip`,
                    saveDate: saveDateMatch ? saveDateMatch[1] : 'Unknown',
                    videoCount: videoCountMatch ? videoCountMatch[1] : 'Unknown'
                });
            }
        }
    
        displayResults(results);
    }

    function displayResults(data) {
        const resultsBar = document.querySelector('.results-bar');
        resultsBar.innerHTML = ''; 
    
        data.forEach(item => {
            const resultItem = document.createElement('div');
            resultItem.classList.add('result-item');
            resultItem.innerHTML = `
                <div class="result-header">
                    <span>${item.channelName}</span>
                    <a href="#" class="download-link" data-folder="${item.channelId}">Download</a>
                </div>
                <div class="result-details">
                    <p>Videos: ${item.videoCount}</p>
                    <p>Save Date: ${item.saveDate}</p>
                </div>
            `;
            resultsBar.appendChild(resultItem);
        });
    
        document.querySelectorAll('.download-link').forEach(link => {
            link.addEventListener('click', async function(event) {
                event.preventDefault();
                const folder = this.getAttribute('data-folder');
                await downloadAndZipFolder(folder);
            });
        });
    }

    async function downloadAndZipFolder(folder) {
        const zip = new JSZip();

        const files = [
            `${folder}_channel_info.txt`,
            `${folder}_video_details.txt`,
            `${folder}_video_ids.txt`
        ];

        for (const file of files) {
            const response = await fetch(`${baseUrl}${folder}/${file}`);
            const text = await response.text();
            zip.file(file, text);
        }

        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, `${folder}.zip`);
    }
});