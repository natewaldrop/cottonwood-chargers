const locationIds = [
    "d0e864cf-fb2a-3dbf-1307-c00000006894",
    "d0e864cf-fb2a-3dbf-1307-c00000002124",
    "d0e864cf-fb2a-3dbf-1307-c00000002125",
    "55a0ffc7-566c-4a64-9d99-3bbb7009e2ce"
];

const apiEndpoint = "https://apigw.blinknetwork.com/v3/locations/";
const mapEndpoint = "https://apigw.blinknetwork.com/v3/locations/map/";

const statusHistory = {};

async function fetchLocationNames() {
    const requests = locationIds.map(id => fetch(`${mapEndpoint}${id}`));
    const responses = await Promise.all(requests);
    const locationNames = await Promise.all(responses.map(res => res.json()));

    const locationMap = {};
    locationIds.forEach((id, index) => {
        locationMap[id] = locationNames[index]?.locationName || `Location ${index + 1}`;
    });

    return locationMap;
}

async function fetchStatus(locationMap) {
    const statusContainer = document.getElementById("status-container");
    statusContainer.innerHTML = ""; // Clear previous data

    const requests = locationIds.map(id => fetch(`${apiEndpoint}${id}`));
    const responses = await Promise.all(requests);
    const locations = await Promise.all(responses.map(res => res.json()));

    locations.forEach((locationData, index) => {
        const locationId = locationIds[index];
        const locationName = locationMap[locationId];

        const locationElement = document.createElement("div");
        locationElement.className = "location";
        locationElement.innerHTML = `<h2>${locationName}</h2>`;

        locationData[0].chargers.forEach(charger => {
            const chargerElement = document.createElement("div");
            chargerElement.className = "charger-status";

            // Set color based on charger status
            const status = charger.status === "AVAILABLE" ? "status-available" :
                charger.status === "CHARGING" ? "status-charging" :
                    charger.status === "COMPLETED_AND_OCCUPIED" ? "status-completed" :
                        charger.status === "STOPPED_AND_OCCUPIED" ? "status-occupied" :
                            "status-offline";

            const statusText = charger.status.replace(/_/g, ' ');
            const powerText = charger.maxPower === 0 ? "" : `${(charger.maxPower / 1000).toFixed(2).slice(0,3)}kW`;

            // Update status history
            const chargerId = charger.portId;
            if (!statusHistory[chargerId]) {
                statusHistory[chargerId] = [];
            }
            const lastStatus = statusHistory[chargerId].slice(-1)[0];
            if (!lastStatus || lastStatus.status !== charger.status) {
                statusHistory[chargerId].push({ status: charger.status, timestamp: new Date() });
            }

            // Calculate duration of current status
            const currentStatus = statusHistory[chargerId].slice(-1)[0];
            const duration = Math.floor((new Date() - new Date(currentStatus.timestamp)) / 1000); // in seconds
            const durationText = `${Math.floor(duration / 60)}m ${duration % 60}s`;

            chargerElement.innerHTML = `
                <span class="indicator ${status} indicator-power-text">${powerText}</span>
                <span class="indicator-text">${(charger.serialNumber).replace("BAE","")} | ${(charger.portName).replace("Series 7 ","")}</span>
                <hr>
                <span class="indicator-status-text">[${statusText}]</span>
                <span class="indicator-duration-text">(${durationText})</span>
            `;
            chargerElement.title = `${charger.maxVoltage}V ${charger.maxCurrent}A ${charger.maxPower}W`;
            locationElement.appendChild(chargerElement);
        });
        statusContainer.appendChild(locationElement);
    });

    // Update last updated time
    document.getElementById("update-time").textContent = new Date().toLocaleString();
}

async function initializePage() {
    const locationMap = await fetchLocationNames();
    fetchStatus(locationMap);
    setInterval(() => fetchStatus(locationMap), 300000); // Refresh every 5 minutes
}

async function refreshStatus() {
    const locationMap = await fetchLocationNames();
    fetchStatus(locationMap);
}

// Warn user before leaving the page
window.addEventListener('beforeunload', (event) => {
    const message = 'Leaving or refreshing the page will rest the status timers, are you sure you want to leave?';
    event.preventDefault();
    event.returnValue = message;
    return message;
});

initializePage();