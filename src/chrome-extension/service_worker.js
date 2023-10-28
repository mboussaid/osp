chrome.tabs.create(
	{ active: false, url: `chrome-extension://${chrome.runtime.id}/index.html` },
	(tab) => {}
);
