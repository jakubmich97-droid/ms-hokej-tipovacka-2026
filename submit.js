const SUPABASE_URL =
  "https://rmqaiaybfxdfxbqznhab.supabase.co";

const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtcWFpYXliZnhkZnhicXpuaGFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NDk4NzEsImV4cCI6MjA5NDUyNTg3MX0.tF9SRcNiwbNmBv7fr0GV-psZ76AKOgiSFCOAn1degok";

const supabaseClient =
  supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

async function loadMatches() {

  const response =
    await fetch("./data/matches.json");

  const data =
    await response.json();

  const select =
    document.getElementById("match-select");

const upcomingMatches =
  data.matches.filter(match => {

    return (
      match.resultHome === "-" ||
      match.resultHome === null ||
      match.resultHome === "" ||
      match.resultHome === undefined
    );

  });

  upcomingMatches.forEach(match => {

    const option =
      document.createElement("option");

    option.value =
      `${match.home}|${match.away}|${match.date}`;

    option.textContent =
      `${formatDate(match.date)} · ${match.home} vs ${match.away}`;

    select.appendChild(option);

  });

}

loadMatches();

function formatDate(dateString) {

  const date =
    new Date(dateString);

  return date.toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "long"
  });

}

const form =
  document.getElementById("tip-form");

form.addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    const status =
      document.getElementById("submit-status");

    status.innerHTML =
      "⏳ Odesílám tip...";

    const playerName =
      document
        .getElementById("player-name")
        .value
        .trim();

    const selectedMatch =
      document
        .getElementById("match-select")
        .value;

    const tipHome =
      Number(
        document
          .getElementById("tip-home")
          .value
      );

    const tipAway =
      Number(
        document
          .getElementById("tip-away")
          .value
      );

    const parts =
      selectedMatch.split("|");

    const homeTeam =
      parts[0];

    const awayTeam =
      parts[1];

    const matchDate =
      parts[2];

    const matchId =
      `${homeTeam}-${awayTeam}-${matchDate}`;

    const { error } =
      await supabaseClient
        .from("tips_inbox")
        .insert({
          player_name: playerName,

          match_id: matchId,

          match_date: matchDate,

          home_team: homeTeam,

          away_team: awayTeam,

          tip_home: tipHome,

          tip_away: tipAway
        });

    if (error) {

      console.error(error);

      status.innerHTML =
        "❌ Nepodařilo se uložit tip.";

      return;
    }

    status.innerHTML =
      "✅ Tip byl úspěšně odeslán!";

    form.reset();

  }
);
