async function loadMatches() {
  const response = await fetch("./data/matches.json");
  const data = await response.json();

  startApp(data.matches, data.lastUpdate);
}

loadMatches();

function isMatchPlayed(match) {
  return match.resultHome !== "-" && match.resultAway !== "-";
}

function startApp(matches, lastUpdate) {
  const leaderboard = {};
  let totalExact = 0;

  matches.forEach(match => {
    if (!isMatchPlayed(match)) {
      return;
    }

    const realWinner = getWinner(match.resultHome, match.resultAway);

    match.tips.forEach(tip => {
      tip.distance = getDistance(
        tip.home,
        tip.away,
        match.resultHome,
        match.resultAway
      );

      tip.correctWinner =
        getWinner(tip.home, tip.away) === realWinner;

      tip.isExact =
        tip.home === match.resultHome &&
        tip.away === match.resultAway;
    });

    const closestTips = getClosestTipsForMatch(match);

    match.tips.forEach(tip => {

      if (!leaderboard[tip.name]) {
        leaderboard[tip.name] = {
          points: 0,
          exact: 0,
          totalTipGoals: 0,
          tipsCount: 0
        };
      }

      leaderboard[tip.name].totalTipGoals +=
        tip.home + tip.away;

      leaderboard[tip.name].tipsCount += 1;

      if (tip.isExact) {
        leaderboard[tip.name].points += 3;
        leaderboard[tip.name].exact += 1;
        totalExact++;
      } else if (closestTips.includes(tip)) {
        leaderboard[tip.name].points += 1;
      }
    });
  });

  const sortedPlayers = Object.entries(leaderboard).sort((a, b) => {
    return b[1].points - a[1].points;
  });

  renderLeaderboard(sortedPlayers);
  renderMatches(matches);
  renderStats(matches, sortedPlayers, totalExact);
  renderLastUpdate(lastUpdate);
  renderPointsChart(matches);
}

function getDistance(
  tipHome,
  tipAway,
  resultHome,
  resultAway
) {
  return (
    Math.abs(tipHome - resultHome) +
    Math.abs(tipAway - resultAway)
  );
}

function getWinner(home, away) {
  if (home > away) return "home";
  if (away > home) return "away";

  return "draw";
}

function getClosestTipsForMatch(match) {

  if (!isMatchPlayed(match)) {
    return [];
  }

  const exactExists = match.tips.some(
    tip => tip.isExact
  );

  if (exactExists) {
    return [];
  }

  const nonExactTips = match.tips.filter(
    tip => !tip.isExact
  );

  const correctWinnerTips = nonExactTips.filter(
    tip => tip.correctWinner
  );

  const tipsForClosest =
    correctWinnerTips.length > 0
      ? correctWinnerTips
      : nonExactTips;

  if (tipsForClosest.length === 0) {
    return [];
  }

  const bestDistance = Math.min(
    ...tipsForClosest.map(tip => tip.distance)
  );

  return tipsForClosest.filter(
    tip => tip.distance === bestDistance
  );
}

function getPositionText(players, index) {

  const currentPoints =
    players[index][1].points;

  const samePointPlayers = players.filter(player => {
    return player[1].points === currentPoints;
  });

  if (samePointPlayers.length === 1) {
    return `${index + 1}`;
  }

  const firstIndex = players.findIndex(player => {
    return player[1].points === currentPoints;
  });

  const lastIndex =
    firstIndex + samePointPlayers.length - 1;

  return `${firstIndex + 1}/${lastIndex + 1}`;
}

function formatDate(dateString) {

  if (!dateString) return "";

  const date = new Date(dateString);

  return date.toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function renderLeaderboard(players) {

  const tbody = document.querySelector(
    "#leaderboard tbody"
  );

  tbody.innerHTML = "";

  players.forEach((player, index) => {

    const name = player[0];
    const data = player[1];

    const row = document.createElement("tr");

    let rankClass = "";

    if (index === 0) rankClass = "rank-1";
    if (index === 1) rankClass = "rank-2";
    if (index === 2) rankClass = "rank-3";

    const positionText =
      getPositionText(players, index);

    const avgGoals =
      (
        data.totalTipGoals /
        data.tipsCount
      ).toFixed(1);

    row.innerHTML = `
      <td class="${rankClass}">
        ${positionText}
      </td>

      <td>
        ${name}
      </td>

      <td>
        ${data.points}
      </td>

      <td>
        ${data.exact}
      </td>

      <td>
        ${avgGoals}
      </td>
    `;

    tbody.appendChild(row);
  });
}

function renderMatches(matches) {

  const playedContainer =
    document.getElementById("played-matches");

  const upcomingContainer =
    document.getElementById("upcoming-matches");

  playedContainer.innerHTML = "";
  upcomingContainer.innerHTML = "";

  const playedMatches =
    matches.filter(isMatchPlayed);

  const upcomingMatches =
    matches.filter(match => !isMatchPlayed(match));

  playedMatches.forEach(match => {
    playedContainer.appendChild(
      createMatchCard(match, true)
    );
  });

  upcomingMatches.forEach(match => {
    upcomingContainer.appendChild(
      createMatchCard(match, false)
    );
  });

  if (playedMatches.length === 0) {
    playedContainer.innerHTML = `
      <div class="card rules">
        Zatím nejsou žádné odehrané zápasy.
      </div>
    `;
  }

  if (upcomingMatches.length === 0) {
    upcomingContainer.innerHTML = `
      <div class="card rules">
        Žádné nadcházející zápasy.
      </div>
    `;
  }
}

function createMatchCard(match, played) {

  const closestTips =
    played
      ? getClosestTipsForMatch(match)
      : [];

  const resultText =
    played
      ? `${match.resultHome}:${match.resultAway}`
      : "čeká se";

  const tipsHtml = match.tips.map(tip => {

    let badge = `
      <span class="badge badge-zero">
        ${played ? "0 bodů" : "nehráno"}
      </span>
    `;

    if (played && tip.isExact) {

      badge = `
        <span class="badge badge-exact">
          +3 body
        </span>
      `;

    } else if (
      played &&
      closestTips.includes(tip)
    ) {

      badge = `
        <span class="badge badge-close">
          +1 bod
        </span>
      `;
    }

    return `
      <tr>
        <td>${tip.name}</td>

        <td>
          ${tip.home}:${tip.away}
        </td>

        <td>
          ${badge}
        </td>
      </tr>
    `;

  }).join("");

  const card = document.createElement("div");

  card.className =
    played
      ? "match-card"
      : "match-card match-card-upcoming";

  card.innerHTML = `
    <div class="match-header">

      <div>

        <div class="match-date">
          ${formatDate(match.date)}
        </div>

        <div class="match-scoreline">

          <div class="team-side">

            <img
              src="./images/flags/${match.homeFlag}.webp"
              class="flag"
              alt="${match.home}"
            >

            <span class="team-name">
              ${match.home}
            </span>

          </div>

          <div class="score-pill">
            ${resultText}
          </div>

          <div class="team-side">

            <img
              src="./images/flags/${match.awayFlag}.webp"
              class="flag"
              alt="${match.away}"
            >

            <span class="team-name">
              ${match.away}
            </span>

          </div>

        </div>

      </div>

    </div>

    <table>

      <thead>
        <tr>
          <th>Hráč</th>
          <th>Tip</th>
          <th>Body</th>
        </tr>
      </thead>

      <tbody>
        ${tipsHtml}
      </tbody>

    </table>
  `;

  return card;
}

function renderStats(
  matches,
  players,
  totalExact
) {

  const playedMatches =
    matches.filter(isMatchPlayed);

  document.getElementById(
    "players-count"
  ).textContent = players.length;

  document.getElementById(
    "matches-count"
  ).textContent = playedMatches.length;

  document.getElementById(
    "exact-count"
  ).textContent = totalExact;

  const leaderElement =
    document.getElementById("current-leader");

  if (players.length > 0) {
    const topPoints = players[0][1].points;
  
    const leaders = players
      .filter(player => player[1].points === topPoints)
      .map(player => player[0]);
  
    leaderElement.innerHTML = `
      <span class="leader-badge">
        👑 ${leaders.join(" / ")}
      </span>
    `;
  
  } else {
    leaderElement.textContent = "-";
  }
}

function renderLastUpdate(lastUpdate) {

  const element =
    document.getElementById("last-update");

  if (!element) return;

  element.textContent =
    `Poslední aktualizace: ${lastUpdate}`;
}

function renderPointsChart(matches) {

  const canvas =
    document.getElementById("pointsChart");

  if (!canvas) return;

  const playedMatches = [...matches]
    .filter(isMatchPlayed)
    .sort((a, b) =>
      new Date(a.date) - new Date(b.date)
    );

  const players = [];

  playedMatches.forEach(match => {

    match.tips.forEach(tip => {

      if (!players.includes(tip.name)) {
        players.push(tip.name);
      }

    });

  });

  const matchesByDate = {};

  playedMatches.forEach(match => {

    if (!matchesByDate[match.date]) {
      matchesByDate[match.date] = [];
    }

    matchesByDate[match.date].push(match);

  });

  const dates = Object.keys(matchesByDate)
    .sort((a, b) =>
      new Date(a) - new Date(b)
    );

  const pointsByPlayer = {};
  const history = {};

  players.forEach(player => {

    pointsByPlayer[player] = 0;
    history[player] = [];

  });

  const labels = dates.map(date =>
    formatDate(date)
  );

  dates.forEach(date => {

    const dayMatches =
      matchesByDate[date];

    dayMatches.forEach(match => {

      match.tips.forEach(tip => {

        if (tip.isExact) {

          pointsByPlayer[tip.name] += 3;

        } else {

          const closestTips =
            getClosestTipsForMatch(match);

          if (closestTips.includes(tip)) {
            pointsByPlayer[tip.name] += 1;
          }

        }

      });

    });

    players.forEach(player => {

      history[player].push(
        pointsByPlayer[player]
      );

    });

  });

  const playerColors = {
    Kuba: "#ff0000",
    Dejv: "#008000",
    Jiřoch: "#1e90ff",
    Luba: "#7b68ee"
  };

  const datasets = players.map(player => {

    const color =
      playerColors[player] || "#ffffff";

    return {
      label: player,
      data: history[player],

      borderColor: color,
      backgroundColor: color,

      tension: 0.35,
      borderWidth: 4,

      fill: false,

      pointRadius: 5,
      pointHoverRadius: 8,
      pointHoverBorderWidth: 4,

      pointBackgroundColor: color,
      pointBorderColor: "#020617",
      pointBorderWidth: 2
    };

  });

  new Chart(canvas, {

    type: "line",

    data: {
      labels,
      datasets
    },

    options: {

      responsive: true,
      maintainAspectRatio: false,

      interaction: {
        mode: "index",
        intersect: false
      },

      plugins: {

        legend: {
          labels: {
            color: "#e0f2fe"
          }
        },

        tooltip: {
          callbacks: {
            label: function(context) {
              return `
                ${context.dataset.label}:
                ${context.parsed.y} bodů
              `;
            }
          }
        }
      },

      scales: {

        x: {
          ticks: {
            color: "#94a3b8"
          },
          grid: {
            color: "rgba(148, 163, 184, 0.12)"
          }
        },

        y: {
          beginAtZero: true,
          ticks: {
            color: "#94a3b8",
            stepSize: 1
          },
          grid: {
            color: "rgba(148, 163, 184, 0.12)"
          }
        }
      }
    }
  });
}
function renderDailyAwards(matches) {
  const playedMatches = matches
    .filter(isMatchPlayed)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (playedMatches.length === 0) {
    return;
  }

  const latestDate = playedMatches[playedMatches.length - 1].date;

  const latestMatches = playedMatches.filter(match => {
    return match.date === latestDate;
  });

  const dailyStats = {};

  latestMatches.forEach(match => {
    const realWinner = getWinner(match.resultHome, match.resultAway);

    match.tips.forEach(tip => {
      if (!dailyStats[tip.name]) {
        dailyStats[tip.name] = {
          points: 0,
          exact: 0
        };
      }

      const distance = getDistance(
        tip.home,
        tip.away,
        match.resultHome,
        match.resultAway
      );

      const isExact =
        tip.home === match.resultHome &&
        tip.away === match.resultAway;

      const correctWinner =
        getWinner(tip.home, tip.away) === realWinner;

      tip.distance = distance;
      tip.isExact = isExact;
      tip.correctWinner = correctWinner;
    });

    const closestTips = getClosestTipsForMatch(match);

    match.tips.forEach(tip => {
      if (tip.isExact) {
        dailyStats[tip.name].points += 3;
        dailyStats[tip.name].exact += 1;
      } else if (closestTips.includes(tip)) {
        dailyStats[tip.name].points += 1;
      }
    });
  });

  const players = Object.entries(dailyStats);

  const maxPoints = Math.max(...players.map(player => player[1].points));
  const minPoints = Math.min(...players.map(player => player[1].points));
  const maxExact = Math.max(...players.map(player => player[1].exact));

  const bestPlayers = players
    .filter(player => player[1].points === maxPoints)
    .map(player => player[0]);

  const worstPlayers = players
    .filter(player => player[1].points === minPoints)
    .map(player => player[0]);

  const sharpshooters = players
    .filter(player => player[1].exact === maxExact && maxExact > 0)
    .map(player => player[0]);

  document.getElementById("daily-best").textContent =
    bestPlayers.join(" / ");

  document.getElementById("daily-worst").textContent =
    worstPlayers.join(" / ");

  document.getElementById("daily-sharpshooter").textContent =
    sharpshooters.length > 0 ? sharpshooters.join(" / ") : "Nikdo";
}

function setupFlipCards() {
  const cards = document.querySelectorAll(".flip-card");

  cards.forEach(card => {
    card.addEventListener("click", () => {
      card.classList.toggle("is-flipped");
    });
  });
}
