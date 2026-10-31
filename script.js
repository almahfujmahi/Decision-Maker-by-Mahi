const decisionName = document.getElementById("decisionName");

const optionInputs = [
    document.getElementById("optionA"),
    document.getElementById("optionB"),
    document.getElementById("optionC")
];

const criteriaGrid = document.getElementById("criteriaGrid");
const comparisonArea = document.getElementById("comparisonArea");
const analyzeBtn = document.getElementById("analyzeBtn");
const errorMessage = document.getElementById("errorMessage");

const results = document.getElementById("results");

let selections = {};

const priorityWeights = {
    "Cost": 3,
    "Quality": 3,
    "Future Benefit": 3,
    "Safety": 2,
    "Accessibility": 2,
    "Personal Preference": 2
};

function getSelectedCriteria() {
    return Array.from(
        criteriaGrid.querySelectorAll("input:checked")
    ).map(input => input.value);
}

function getOptionNames() {
    return optionInputs.map(input => input.value.trim());
}

function updateComparison() {
    const criteria = getSelectedCriteria();
    const optionNames = getOptionNames();

    const allOptionsEntered = optionNames.every(name => name !== "");

    if (!allOptionsEntered || criteria.length === 0) {
        comparisonArea.innerHTML = `
            <p class="empty-message">
                Add all three options and select at least one priority to begin.
            </p>
        `;
        return;
    }

    let html = "";

    criteria.forEach(criterion => {
        if (!selections[criterion]) {
            selections[criterion] = "";
        }

        html += `
            <div class="comparison-row">
                <div class="comparison-title">${criterion}</div>

                <div class="comparison-choices">
                    ${optionNames.map((name, index) => `
                        <button
                            class="choice-btn ${
                                selections[criterion] === String(index)
                                    ? "selected"
                                    : ""
                            }"
                            data-criterion="${criterion}"
                            data-option="${index}"
                            type="button"
                        >
                            ${escapeHTML(name)}
                        </button>
                    `).join("")}
                </div>
            </div>
        `;
    });

    comparisonArea.innerHTML = html;
}

function escapeHTML(value) {
    return value.replace(/[&<>"']/g, character => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}

criteriaGrid.addEventListener("change", () => {
    updateComparison();
});

optionInputs.forEach(input => {
    input.addEventListener("input", updateComparison);
});

comparisonArea.addEventListener("click", event => {
    const button = event.target.closest(".choice-btn");

    if (!button) {
        return;
    }

    const criterion = button.dataset.criterion;
    const option = button.dataset.option;

    selections[criterion] = option;

    updateComparison();
});

analyzeBtn.addEventListener("click", analyzeDecision);

function analyzeDecision() {
    errorMessage.textContent = "";

    const name = decisionName.value.trim();
    const optionNames = getOptionNames();
    const criteria = getSelectedCriteria();

    if (!name) {
        showError("Please enter the name of your decision.");
        return;
    }

    if (optionNames.some(option => option === "")) {
        showError("Please enter all three options.");
        return;
    }

    if (new Set(optionNames.map(name => name.toLowerCase())).size !== 3) {
        showError("Please use three different option names.");
        return;
    }

    if (criteria.length === 0) {
        showError("Please select at least one priority.");
        return;
    }

    const unanswered = criteria.filter(
        criterion => selections[criterion] === undefined ||
        selections[criterion] === ""
    );

    if (unanswered.length > 0) {
        showError("Please compare all selected priorities.");
        return;
    }

    const scores = [0, 0, 0];
    let totalWeight = 0;

    criteria.forEach(criterion => {
        const weight = priorityWeights[criterion] || 1;
        const selectedOption = Number(selections[criterion]);

        scores[selectedOption] += weight;
        totalWeight += weight;
    });

    const percentages = scores.map(score => {
        return Math.round((score / totalWeight) * 100);
    });

    const ranking = optionNames.map((name, index) => ({
        name,
        score: scores[index],
        percentage: percentages[index],
        index
    }));

    ranking.sort((a, b) => b.score - a.score);

    showResults(name, ranking, criteria, totalWeight);
}

function showError(message) {
    errorMessage.textContent = message;
}

function showResults(name, ranking, criteria, totalWeight) {
    document.getElementById("resultDecisionName").textContent = name;

    const winner = ranking[0];

    const winnerCard = document.getElementById("winnerCard");

    const hasTie = ranking.filter(
        option => option.score === winner.score
    ).length > 1;

    winnerCard.innerHTML = `
        <div class="winner-label">
            ${hasTie ? "TOP RESULT" : "RECOMMENDED OPTION"}
        </div>

        <h3>${escapeHTML(winner.name)}</h3>

        <p>
            ${
                hasTie
                    ? "There is a tie. Consider the risk analysis before making your final choice."
                    : "This option performed best across your selected priorities."
            }
        </p>
    `;

    showRanking(ranking);
    showChart(ranking);
    showRiskAnalysis(ranking, criteria);

    results.classList.remove("hidden");

    results.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function showRanking(ranking) {
    const rankingList = document.getElementById("rankingList");

    rankingList.innerHTML = ranking.map((option, index) => `
        <div class="ranking-item">
            <div>
                <span class="rank-number">#${index + 1}</span>
                <span class="rank-name">${escapeHTML(option.name)}</span>
            </div>

            <span class="rank-score">${option.percentage}%</span>
        </div>
    `).join("");
}

function showChart(ranking) {
    const chartArea = document.getElementById("chartArea");

    chartArea.innerHTML = ranking.map(option => `
        <div class="chart-item">
            <div class="chart-label">
                <span>${escapeHTML(option.name)}</span>
                <strong>${option.percentage}%</strong>
            </div>

            <div class="chart-track">
                <div
                    class="chart-fill"
                    style="width: ${option.percentage}%"
                ></div>
            </div>
        </div>
    `).join("");
}

function showRiskAnalysis(ranking, criteria) {
    const riskAnalysis = document.getElementById("riskAnalysis");

    const winner = ranking[0];
    const tiedOptions = ranking.filter(
        option => option.score === winner.score
    );

    let html = "";

    if (tiedOptions.length > 1) {
        html += `
            <div class="risk-item warning">
                <strong>Close result</strong>
                More than one option received the same score.
                You may need additional information before deciding.
            </div>
        `;
    } else if (ranking[1].score === winner.score) {
        html += `
            <div class="risk-item warning">
                <strong>Very close competition</strong>
                The top two options received the same score.
                Take some extra time before choosing.
            </div>
        `;
    } else {
        html += `
            <div class="risk-item good">
                <strong>Clear top result</strong>
                ${escapeHTML(winner.name)} received the highest score.
            </div>
        `;
    }

    const unselectedCriteria = [
        "Cost",
        "Quality",
        "Future Benefit",
        "Safety",
        "Accessibility",
        "Personal Preference"
    ].filter(criterion => !criteria.includes(criterion));

    if (unselectedCriteria.length > 0) {
        html += `
            <div class="risk-item warning">
                <strong>Unconsidered priorities</strong>
                You did not include: ${unselectedCriteria.join(", ")}.
                These factors may still affect your final decision.
            </div>
        `;
    }

    html += `
        <div class="risk-item">
            <strong>Remember</strong>
            This result reflects your selected priorities and preferences.
            It does not replace checking real-world costs, requirements or risks.
        </div>
    `;

    riskAnalysis.innerHTML = html;
}

document.getElementById("editBtn").addEventListener("click", () => {
    results.classList.add("hidden");

    document.querySelector(".workspace").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
});