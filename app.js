// app.js
// Automatic distance / time / fare calculator using Haversine formula
// No backend required — uses a local list of named places (lat/lon)

// ---------- Starter locations (Monrovia) ----------
const locations = {
  "red light": { lat: 6.3139, lon: -10.7600 },
  "broad street": { lat: 6.3106, lon: -10.8010 },
  "elua": { lat: 6.2830, lon: -10.7608 },
  "water side": { lat: 6.3007, lon: -10.7964 },
  "duala": { lat: 6.3325, lon: -10.7925 },
  "sinkor": { lat: 6.2826, lon: -10.7757 },
  "mamba point": { lat: 6.3029, lon: -10.7868 },

  "mesurado bridge": { lat: 6.3005, lon: -10.7969 },
  "st. paul bridge": { lat: 6.2915, lon: -10.7380 },

  "popo beach junction": { lat: 6.2500, lon: -10.8000 },
  "small catholic junction": { lat: 6.2580, lon: -10.7950 },
  "turning point junction": { lat: 6.2600, lon: -10.7900 },
  "shared taxi to paynesville": { lat: 6.3100, lon: -10.7600 },
  "god's favor woodshop": { lat: 6.2750, lon: -10.7800 },

  "trans-west african coastal highway": { lat: 6.2800, lon: -10.8000 },

  "hotel africa road": { lat: 6.3020, lon: -10.7850 },
  "kyle local road": { lat: 6.2950, lon: -10.7900 },
  "caldwell road": { lat: 6.3300, lon: -10.7600 },

  "benson street": { lat: 6.3070, lon: -10.7990 },
  "mechlin street": { lat: 6.3050, lon: -10.7980 },
  "horton avenue": { lat: 6.3040, lon: -10.7970 },
  "lynch street": { lat: 6.3060, lon: -10.8000 },
  "mcdonald street": { lat: 6.3035, lon: -10.7960 },

  "chicken soup factory road": { lat: 6.3150, lon: -10.7800 },

  "clay street": { lat: 6.3080, lon: -10.7980 },
  "gurley street": { lat: 6.3025, lon: -10.7975 },
  "johnson street": { lat: 6.3030, lon: -10.7985 },
  "newport street": { lat: 6.3035, lon: -10.7920 },
  "water street": { lat: 6.3000, lon: -10.7900 },
  "randall street": { lat: 6.3030, lon: -10.7940 }
};

// ---------- Fare / speed defaults (editable in UI) ----------
let baseFare = Number(localStorage.getItem('baseFare')) || 100; // LD$
let pricePerKm = Number(localStorage.getItem('pricePerKm')) || 45; // LD$ per km
let averageSpeed = Number(localStorage.getItem('avgSpeed')) || 25; // km/h

// ---------- Utility functions ----------
function normalizeName(s) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in KM
  const toRad = angle => (angle * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // in kilometers
}

function calculateFare(distanceKm) {
  // fare = base + pricePerKm * distance
  const fare = baseFare + pricePerKm * distanceKm;
  return Math.round(fare); // round to nearest LD$
}

function estimateTimeMinutes(distanceKm) {
  // time = distance / speed (hours), convert to minutes
  const hours = distanceKm / averageSpeed;
  return Math.max(1, Math.round(hours * 60)); // at least 1 minute
}

// ---------- UI helpers ----------
function populateDatalistAndUI() {
  const datalist = document.getElementById("placesList");
  datalist.innerHTML = "";
  const placesContainer = document.getElementById("placesListUI");
  placesContainer.innerHTML = "";

  Object.keys(locations).sort().forEach(name => {
    const option = document.createElement("option");
    option.value = name;
    datalist.appendChild(option);

    const pill = document.createElement("div");
    pill.className = "place-pill";
    pill.textContent = name;
    pill.onclick = () => {
      // fill from or to depending on focus (if none, fill 'from')
      const fromEl = document.getElementById("from");
      const toEl = document.getElementById("to");
      if (document.activeElement === toEl) {
        toEl.value = name;
      } else {
        fromEl.value = name;
      }
    };
    placesContainer.appendChild(pill);
  });
}

function showResult(html) {
  document.getElementById("result").innerHTML = html;
}

// ---------- Core: find route ----------
function findRoute() {
  const fromRaw = document.getElementById("from").value;
  const toRaw = document.getElementById("to").value;
  const from = normalizeName(fromRaw);
  const to = normalizeName(toRaw);

  if (!from || !to) {
    showResult("Please enter both locations.");
    return;
  }
  if (from === to) {
    showResult("Starting point and destination are the same.");
    return;
  }

  if (!locations[from] || !locations[to]) {
    let missing = [];
    if (!locations[from]) missing.push(`'${fromRaw || from}'`);
    if (!locations[to]) missing.push(`'${toRaw || to}'`);
    showResult(`
      Location(s) not found: ${missing.join(", ")}.<br>
      You can add them below using name + lat/lon (decimal degrees).<br>
      Known places are listed below and available in suggestions.
    `);
    return;
  }

  const f = locations[from];
  const t = locations[to];

  const distanceKm = haversine(f.lat, f.lon, t.lat, t.lon);
  const timeMin = estimateTimeMinutes(distanceKm);
  const fare = calculateFare(distanceKm);

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${f.lat},${f.lon}&destination=${t.lat},${t.lon}`;

  const paymentMethod = document.getElementById("payment").value;

if (!paymentMethod) {
  showResult("Please select a payment method.");
  return;
}

  showResult(`
    <strong>From:</strong> ${from} <br>
    <strong>To:</strong> ${to} <br>
    <strong>Distance:</strong> ${distanceKm.toFixed(2)} km<br>
    <strong>Estimated Time:</strong> ${timeMin} mins (avg ${averageSpeed} km/h)<br>
    <strong>Estimated Fare:</strong> LD$ ${fare}<br><br>
    <strong>Payment Method:</strong> ${paymentMethod}<br><br>
    <a href="${mapsUrl}" target="_blank">Open route in Google Maps</a>
  `);
}

const drivers = [
  {
    name: "James Doe",
    vehicle: "Toyota Corolla",
    plate: "AB-2345",
    payment: ["Cash", "Mobile Money"],
    location: "broad street"
  },
  {
    name: "Sarah Johnson",
    vehicle: "Kia Picanto",
    plate: "T-8891",
    payment: ["Cash", "Orange Money"],
    location: "duala"
  }
];

function renderDrivers() {
  const container = document.getElementById("driverList");
  container.innerHTML = "";

  drivers.forEach(d => {
    const div = document.createElement("div");
    div.className = "driver-card";
    div.innerHTML = `
      <strong>${d.name}</strong><br>
      Vehicle: ${d.vehicle}<br>
      Plate: ${d.plate}<br>
      Payment: ${d.payment.join(", ")}<br>
      Location: ${d.location}
    `;
    container.appendChild(div);
  });
}

renderDrivers();

// ---------- Add / update a location ----------
function addOrUpdateLocation() {
  const nameRaw = document.getElementById("locName").value;
  const latRaw = document.getElementById("locLat").value;
  const lonRaw = document.getElementById("locLon").value;
  const name = normalizeName(nameRaw);

  const msg = document.getElementById("addMsg");

  if (!name || !latRaw || !lonRaw) {
    msg.textContent = "Please provide name, latitude and longitude.";
    msg.style.color = "crimson";
    return;
  }

  const lat = parseFloat(latRaw);
  const lon = parseFloat(lonRaw);
  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    msg.textContent = "Latitude and Longitude must be valid decimal numbers.";
    msg.style.color = "crimson";
    return;
  }

  locations[name] = { lat, lon };
  populateDatalistAndUI();
  msg.textContent = `Location '${name}' added/updated.`;
  msg.style.color = "green";

  // clear inputs
  document.getElementById("locName").value = "";
  document.getElementById("locLat").value = "";
  document.getElementById("locLon").value = "";
}

// ---------- Settings ----------
function loadSettingsToUI() {
  document.getElementById("baseFare").value = baseFare;
  document.getElementById("pricePerKm").value = pricePerKm;
  document.getElementById("avgSpeed").value = averageSpeed;
}

function saveSettingsFromUI() {
  baseFare = Number(document.getElementById("baseFare").value) || baseFare;
  pricePerKm = Number(document.getElementById("pricePerKm").value) || pricePerKm;
  averageSpeed = Number(document.getElementById("avgSpeed").value) || averageSpeed;

  // persist
  localStorage.setItem('baseFare', baseFare);
  localStorage.setItem('pricePerKm', pricePerKm);
  localStorage.setItem('avgSpeed', averageSpeed);

  showResult(`Settings saved. Base: LD$${baseFare}, LD$${pricePerKm}/km, Avg speed: ${averageSpeed} km/h`);
}

// ---------- Event wiring ----------
document.getElementById("searchBtn").addEventListener("click", findRoute);
document.getElementById("addLocationBtn").addEventListener("click", addOrUpdateLocation);
document.getElementById("saveSettings").addEventListener("click", saveSettingsFromUI);

// Support pressing Enter on inputs to search
["from", "to"].forEach(id => {
  document.getElementById(id).addEventListener("keypress", (e) => {
    if (e.key === "Enter") findRoute();
  });
});

// Initialize UI
populateDatalistAndUI();
loadSettingsToUI();
