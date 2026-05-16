async function loadMatches() {
  const response = await fetch("./data/matches.json");
  const matches = await response.json();

  startApp(matches);
}

loadMatches();

function startApp(matches) {
  const leaderboard = {};
  let totalExact = 0;

  matches.forEach(match => {
    const realWinner = getWinner(match.resultHome, match.resultAway);

    match.tips.forEach(tip => {
      tip.distance = getDistance(
        tip.home,
        tip.away,
        match.resultHome,
        match.resultAway
      );

      tip.correctWinner = getWinner(tip.home, tip.away) === realWinner;

      tip.isExact =
        tip.home === match.resultHome &&
        tip.away === match.resultAway;
    });

    const closestTips = getClosestTipsForMatch(match);

    match.tips.forEach(tip => {
      if (!leaderboard[tip.name]) {
        leaderboard[tip.name] = {
          points: 0,
          exact: 0
        };
      }

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
}

function getDistance(tipHome, tipAway, resultHome, resultAway) {
  return Math.abs(tipHome - resultHome) + Math.abs(tipAway - resultAway);
}

function getWinner(home, away) {
  if (home > away) return "home";
  if (away > home) return "away";
  return "draw";
}

function getClosestTipsForMatch(match) {
  const exactExists = match.tips.some(tip => tip.isExact);

  if (exactExists) {
    return [];
  }

  const nonExactTips = match.tips.filter(tip => !tip.isExact);
  const correctWinnerTips = nonExactTips.filter(tip => tip.correctWinner);

  const tipsForClosest =
    correctWinnerTips.length > 0 ? correctWinnerTips : nonExactTips;

  if (tipsForClosest.length === 0) {
    return [];
  }

  const bestDistance = Math.min(...tipsForClosest.map(tip => tip.distance));

  return tipsForClosest.filter(tip => tip.distance === bestDistance);
}

function getPositionText(players, index) {
  const currentPoints = players[index][1].points;

  const samePointPlayers = players.filter(player => {
    return player[1].points === currentPoints;
  });

  if (samePointPlayers.length === 1) {
    return `${index + 1}`;
  }

  const firstIndex = players.findIndex(player => {
    return player[1].points === currentPoints;
  });

  const lastIndex = firstIndex + samePointPlayers.length - 1;

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
  const tbody = document.querySelector("#leaderboard tbody");
  tbody.innerHTML = "";

  players.forEach((player, index) => {
    const name = player[0];
    const data = player[1];

    const row = document.createElement("tr");

    let rankClass = "";
    if (index === 0) rankClass = "rank-1";
    if (index === 1) rankClass = "rank-2";
    if (index === 2) rankClass = "rank-3";

    const positionText = getPositionText(players, index);

    row.innerHTML = `
      <td class="${rankClass}">${positionText}</td>
      <td>${name}</td>
      <td>${data.points}</td>
      <td>${data.exact}</td>
    `;

    tbody.appendChild(row);
  });
}

function renderMatches(matches) {
  const container = document.getElementById("matches");
  container.innerHTML = "";

  matches.forEach(match => {
    const closestTips = getClosestTipsForMatch(match);

    const tipsHtml = match.tips.map(tip => {
      let badge = `<span class="badge badge-zero">0 bodů</span>`;

      if (tip.isExact) {
        badge = `<span class="badge badge-exact">+3 body</span>`;
      } else if (closestTips.includes(tip)) {
        badge = `<span class="badge badge-close">+1 bod</span>`;
      }

      return `
        <tr>
          <td>${tip.name}</td>
          <td>${tip.home}:${tip.away}</td>
          <td>${badge}</td>
        </tr>
      `;
    }).join("");

    const card = document.createElement("div");
    card.className = "match-card";

    card.innerHTML = `
      <div class="match-header">
        <div>
          <div class="match-date">
            ${formatDate(match.date)}
          </div>

          <div class="match-title">
            ${match.home} vs ${match.away}
          </div>
        </div>

        <div class="match-result">
          ${match.resultHome}:${match.resultAway}
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

    container.appendChild(card);
  });
}

function renderStats(matches, players, totalExact) {
  document.getElementById("players-count").textContent = players.length;
  document.getElementById("matches-count").textContent = matches.length;
  document.getElementById("exact-count").textContent = totalExact;

  document.getElementById("current-leader").textContent =
    players.length > 0 ? players[0][0] : "-";
}
