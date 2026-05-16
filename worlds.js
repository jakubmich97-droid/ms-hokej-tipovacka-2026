async function loadWorlds() {
  const response = await fetch("./data/matches.json");
  const data = await response.json();

  startWorlds(data.matches);
}

loadWorlds();

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

  renderWorldTable(matches, players[0]);

  select.addEventListener("change", event => {

    renderWorldTable(
      matches,
      event.target.value
    );

  });
}

function renderWorldTable(matches, playerName) {

  const tbody = document.querySelector(
    "#world-table tbody"
  );

  tbody.innerHTML = "";

  const table = {};

  matches.forEach(match => {

    const playerTip = match.tips.find(
      tip => tip.name === playerName
    );

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

    }
  });

  const sortedTeams = Object.entries(table)
    .sort((a, b) => {

      if (b[1].points !== a[1].points) {
        return b[1].points - a[1].points;
      }

      const goalDiffA =
        a[1].gf - a[1].ga;

      const goalDiffB =
        b[1].gf - b[1].ga;

      return goalDiffB - goalDiffA;
    });

  sortedTeams.forEach((team, index) => {

    const name = team[0];
    const stats = team[1];

    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${index + 1}</td>

      <td>
        ${name}
      </td>

      <td>
        ${stats.points}
      </td>

      <td>
        ${stats.gf}:${stats.ga}
      </td>
    `;

    tbody.appendChild(row);
  });
}

function createTeamStats() {

  return {
    points: 0,
    wins: 0,
    losses: 0,
    gf: 0,
    ga: 0
  };
}