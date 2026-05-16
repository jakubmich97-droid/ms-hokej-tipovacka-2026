async function loadWorlds() {
  const response = await fetch("./data/matches.json");
  const data = await response.json();

  startWorlds(data.matches);
}

loadWorlds();

function isMatchPlayed(match) {
  return match.resultHome !== "-" && match.resultAway !== "-";
}

function startWorlds(matches) {
  const select = document.getElementById("player-select");
  const players = [];

  matches.forEach(match => {
    match.tips.forEach(tip => {
      if (!players.includes(tip.name)) {
        players.push(tip.name);
      }
    });
  });

  players.sort();

  players.forEach(player => {
    const option = document.createElement("option");
    option.value = player;
    option.textContent = player;
    select.appendChild(option);
  });

  renderAllGroups(matches, players[0]);

  select.addEventListener("change", event => {
    renderAllGroups(matches, event.target.value);
  });
}

function renderAllGroups(matches, playerName) {
  renderGroupTable(matches, playerName, "A", "group-a-table");
  renderGroupTable(matches, playerName, "B", "group-b-table");
}

function renderGroupTable(matches, playerName, groupName, tableId) {
  const tbody = document.querySelector(`#${tableId} tbody`);
  tbody.innerHTML = "";

  const table = {};

  const groupMatches = matches.filter(match => {
    return match.group === groupName && isMatchPlayed(match);
  });

  groupMatches.forEach(match => {
    const playerTip = match.tips.find(tip => tip.name === playerName);

    if (!playerTip) return;

    const homeTeam = match.home;
    const awayTeam = match.away;

    if (!table[homeTeam]) {
      table[homeTeam] = createTeamStats();
    }

    if (!table[awayTeam]) {
      table[awayTeam] = createTeamStats();
    }

    const homeGoals = playerTip.home;
    const awayGoals = playerTip.away;

    table[homeTeam].played += 1;
    table[awayTeam].played += 1;

    table[homeTeam].gf += homeGoals;
    table[homeTeam].ga += awayGoals;

    table[awayTeam].gf += awayGoals;
    table[awayTeam].ga += homeGoals;

    if (homeGoals > awayGoals) {
      table[homeTeam].points += 3;
      table[homeTeam].wins += 1;
      table[awayTeam].losses += 1;
    } else if (awayGoals > homeGoals) {
      table[awayTeam].points += 3;
      table[awayTeam].wins += 1;
      table[homeTeam].losses += 1;
    } else {
      table[homeTeam].points += 1;
      table[awayTeam].points += 1;
      table[homeTeam].draws += 1;
      table[awayTeam].draws += 1;
    }
  });

  const sortedTeams = Object.entries(table).sort((a, b) => {
    const statsA = a[1];
    const statsB = b[1];

    if (statsB.points !== statsA.points) {
      return statsB.points - statsA.points;
    }

    const diffA = statsA.gf - statsA.ga;
    const diffB = statsB.gf - statsB.ga;

    if (diffB !== diffA) {
      return diffB - diffA;
    }

    return statsB.gf - statsA.gf;
  });

  sortedTeams.forEach((team, index) => {
    const name = team[0];
    const stats = team[1];

    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${name}</td>
      <td>${stats.played}</td>
      <td>${stats.wins}</td>
      <td>${stats.losses}</td>
      <td>${stats.gf}:${stats.ga}</td>
      <td>${stats.points}</td>
    `;

    tbody.appendChild(row);
  });

  if (sortedTeams.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7">Zatím nejsou odehrané zápasy v této skupině.</td>
      </tr>
    `;
  }
}

function createTeamStats() {
  return {
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    gf: 0,
    ga: 0,
    points: 0
  };
}
