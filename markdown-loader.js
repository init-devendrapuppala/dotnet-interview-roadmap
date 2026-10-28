(() => {
    const viewer = document.querySelector("#documentation");
    const title = document.querySelector("#documentation-title");
    const content = document.querySelector("#documentation-content");
    const pageBase = new URL(".", window.location.href);
    const topicsBasePath = new URL("topics/", pageBase).pathname;
    const initialTitle = title.textContent;
    const initialContent = content.innerHTML;
    const markdownCache = new Map();
    let activePath = null;
    let loadId = 0;

    const resolveMarkdownPath = path => {
        if (typeof path !== "string" || !path.trim()) {
            return null;
        }

        const url = new URL(path, pageBase);
        if (
            url.origin !== window.location.origin ||
            !url.pathname.startsWith(topicsBasePath) ||
            !url.pathname.toLowerCase().endsWith(".md")
        ) {
            return null;
        }

        return {
            path: decodeURIComponent(url.pathname.slice(pageBase.pathname.length)),
            url
        };
    };

    const fetchMarkdown = async (path, url) => {
        let request = markdownCache.get(path);
        if (!request) {
            request = fetch(url.href).then(response => {
                if (!response.ok) {
                    throw new Error(`Markdown request failed (${response.status}): ${url.href}`);
                }
                return response.text();
            });
            markdownCache.set(path, request);
        }

        try {
            return await request;
        } catch (error) {
            if (markdownCache.get(path) === request) {
                markdownCache.delete(path);
            }
            throw error;
        }
    };

    const scrollViewerToTop = () => {
        viewer.scrollTop = 0;
        if (window.matchMedia("(max-width: 850px)").matches) {
            viewer.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    const showUnavailable = () => {
        title.textContent = "Topic not available";
        content.classList.remove("loading");
        content.innerHTML = "<h1>Topic not available</h1><p>This page hasn't been generated yet.</p>";
        scrollViewerToTop();
    };

    const loadMarkdown = async (path, { updateHistory = true } = {}) => {
        let resolved;
        try {
            resolved = resolveMarkdownPath(path);
        } catch (error) {
            console.warn("Unable to resolve the requested Markdown topic.", error);
        }

        if (!resolved) {
            loadId += 1;
            activePath = null;
            window.roadmapUI.selectTopic(null);
            showUnavailable();
            return;
        }

        const requestId = ++loadId;
        activePath = resolved.path;
        const topic = window.roadmapUI.findTopic(resolved.path);
        window.roadmapUI.selectTopic(resolved.path);
        title.textContent = topic ? topic.title : "Documentation";
        content.classList.add("loading");
        content.textContent = "Loading...";
        scrollViewerToTop();

        if (updateHistory) {
            const nextUrl = new URL(window.location.href);
            nextUrl.searchParams.set("topic", resolved.path);
            nextUrl.hash = "";
            window.history.pushState(
                { topic: resolved.path },
                "",
                `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`
            );
        }

        try {
            const markdown = await fetchMarkdown(resolved.path, resolved.url);
            if (requestId !== loadId) {
                return;
            }
            content.innerHTML = window.marked.parse(markdown);
            content.classList.remove("loading");
            scrollViewerToTop();
        } catch (error) {
            if (requestId !== loadId) {
                return;
            }
            console.error(`Unable to load Markdown topic "${resolved.path}".`, error);
            showUnavailable();
        }
    };

    const showRoadmapHome = () => {
        loadId += 1;
        activePath = null;
        window.roadmapUI.selectTopic(null);
        title.textContent = initialTitle;
        content.classList.remove("loading");
        content.innerHTML = initialContent;
        scrollViewerToTop();
    };

    content.addEventListener("click", event => {
        const link = event.target.closest("a[href]");
        if (!link || !activePath) {
            return;
        }

        let destination;
        try {
            destination = new URL(link.getAttribute("href"), new URL(activePath, pageBase));
        } catch {
            return;
        }

        if (
            destination.origin !== window.location.origin ||
            !destination.pathname.toLowerCase().endsWith(".md")
        ) {
            return;
        }

        const relativePath = decodeURIComponent(destination.pathname.slice(pageBase.pathname.length));
        const resolved = resolveMarkdownPath(relativePath);
        if (!resolved) {
            return;
        }

        event.preventDefault();
        void loadMarkdown(resolved.path);
    });

    window.loadMarkdown = loadMarkdown;
    window.addEventListener("popstate", () => {
        const path = new URLSearchParams(window.location.search).get("topic");
        if (path) {
            void loadMarkdown(path, { updateHistory: false });
        } else {
            showRoadmapHome();
        }
    });

    const initialPath = new URLSearchParams(window.location.search).get("topic");
    if (initialPath) {
        void loadMarkdown(initialPath, { updateHistory: false });
    }
})();
