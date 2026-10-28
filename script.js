(() => {
    const grid = document.querySelector("#roadmap");
    const stats = document.querySelector("#stats");
    const levels = ["Basic", "Intermediate", "Advanced"];
    let openCategory = null;
    let activeTopic = null;

    const topics = () => ROADMAP.flatMap(category =>
        category.topics.map(topic => ({ ...topic, categoryId: category.id }))
    );

    const findTopic = path => topics().find(topic => topic.path === path);

    const render = () => {
        const allTopics = topics();
        stats.innerHTML = [
            [ROADMAP.length, "Categories"],
            [allTopics.length, "Topics"],
            ["Static", "GitHub Pages"]
        ].map(([value, label]) =>
            `<div class="stat"><strong>${value}</strong><span>${label}</span></div>`
        ).join("");

        grid.innerHTML = ROADMAP.map(category => {
            const isOpen = openCategory === category.id;
            return `
                <article class="item ${isOpen ? "open" : ""}">
                    <button class="card" data-category="${category.id}" aria-expanded="${isOpen}" type="button">
                        <b class="icon">${category.icon}</b>
                        <span class="copy">
                            <strong>${category.title}</strong>
                            <small>${category.description}</small>
                        </span>
                        <span class="footer">
                            <span>${category.topics.length} topics</span>
                            <em>${isOpen ? "Close" : "Explore"} <b>⌄</b></em>
                        </span>
                    </button>
                    ${isOpen ? `
                        <div class="accordion">
                            <div class="topic-list">
                                ${levels.map(level => {
                                    const levelTopics = category.topics.filter(topic => topic.level === level);
                                    if (!levelTopics.length) {
                                        return "";
                                    }
                                    return `
                                        <section class="level-group" aria-labelledby="${category.id}-${level.toLowerCase()}">
                                            <h3 class="level-heading ${level.toLowerCase()}" id="${category.id}-${level.toLowerCase()}">
                                                <span>${level}</span>
                                                <small>${levelTopics.length} topics</small>
                                            </h3>
                                            <div class="level-topics">
                                                ${levelTopics.map(topic => `
                                                    <button class="topic-chip ${activeTopic === topic.path ? "active" : ""}" data-topic="${topic.path}" type="button">
                                                        <span>${topic.title}</span>
                                                        <small>${topic.readingTime} · ${topic.difficulty}</small>
                                                    </button>
                                                `).join("")}
                                            </div>
                                        </section>
                                    `;
                                }).join("")}
                            </div>
                        </div>
                    ` : ""}
                </article>
            `;
        }).join("");
    };

    grid.addEventListener("click", event => {
        const categoryButton = event.target.closest("[data-category]");
        if (categoryButton) {
            openCategory = openCategory === categoryButton.dataset.category
                ? null
                : categoryButton.dataset.category;
            render();
            return;
        }

        const topicButton = event.target.closest("[data-topic]");
        if (topicButton) {
            window.loadMarkdown(topicButton.dataset.topic);
        }
    });

    window.roadmapUI = {
        findTopic,
        selectTopic(path) {
            activeTopic = path || null;
            const topic = path ? findTopic(path) : null;
            if (topic) {
                openCategory = topic.categoryId;
            } else if (!path) {
                openCategory = null;
            }
            render();
        }
    };

    render();
})();
