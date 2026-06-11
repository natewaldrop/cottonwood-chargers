const chargehubEndpoint = "https://chargehub.azure-api.net/chapi/prod/stations/details?language=en&station_id=";
const subscriptionKey = "";

const statusHistory = {};
let layoutConfig = null;

function splitDisplayName(displayName) {
    if (!displayName) {
        return { base: "", port: 1 };
    }

    const match = displayName.toUpperCase().match(/^(.*?)-(\d+)$/);
    if (!match) {
        return { base: displayName.toUpperCase(), port: 1 };
    }

    return {
        base: match[1],
        port: Number(match[2])
    };
}

function getFetchOptions() {
    if (!subscriptionKey) {
        return undefined;
    }

    return {
        headers: {
            "Ocp-Apim-Subscription-Key": subscriptionKey
        }
    };
}

async function fetchChargehubStation(stationId) {
    const endpoint = `${chargehubEndpoint}${stationId}`;
    const response = await fetch(endpoint, getFetchOptions());

    if (!response.ok) {
        throw new Error(`Chargehub request failed for ${stationId}: ${response.status}`);
    }

    return response.json();
}

async function fetchChargehubData() {
    const stationIds = layoutConfig?.chargehubStationIds || [];
    const results = await Promise.all(
        stationIds.map(async (stationId) => {
            try {
                const data = await fetchChargehubStation(stationId);
                return { stationId, data };
            } catch (error) {
                // Local fallback allows testing when API key/CORS blocks browser requests.
                const localResponse = await fetch(`JsonResponse/${stationId}.json`);
                if (!localResponse.ok) {
                    throw error;
                }
                const localData = await localResponse.json();
                return { stationId, data: localData };
            }
        })
    );

    const stations = {};
    results.forEach((result) => {
        stations[result.stationId] = result.data;
    });

    return stations;
}

async function fetchLayoutConfig() {
    if (layoutConfig) {
        return layoutConfig;
    }

    const response = await fetch("legacy-layout.json");
    if (!response.ok) {
        throw new Error(`Failed to load mapping config: ${response.status}`);
    }

    layoutConfig = await response.json();
    return layoutConfig;
}

function flattenPorts(stationDataById) {
    const byExact = new Map();
    const byDefault = new Map();

    Object.entries(stationDataById).forEach(([stationIdText, payload]) => {
        const stationId = Number(stationIdText);
        const plugs = payload?.station?.PlugsArray || [];

        plugs.forEach((plug) => {
            const ports = plug?.Ports || [];
            ports.forEach((port) => {
                const parsed = splitDisplayName(port.displayName);
                const entry = {
                    stationId,
                    base: parsed.base,
                    port: parsed.port,
                    portId: port.portId,
                    netPortId: port.netPortId,
                    statusCode: port.status,
                    statusText: port?.statusInfo?.string || "Unknown",
                    powerKwText: plug?.Kw || "",
                    ampText: plug?.Amp || "",
                    voltText: plug?.Volt || ""
                };

                byExact.set(`${stationId}|${entry.base}|${entry.port}`, entry);
                if (!byDefault.has(`${stationId}|${entry.base}`) || entry.port === 1) {
                    byDefault.set(`${stationId}|${entry.base}`, entry);
                }
            });
        });
    });

    return { byExact, byDefault };
}

function resolveMappedPort(lookup, mapConfig) {
    if (!mapConfig) {
        return null;
    }

    const stationId = mapConfig.stationId;
    const base = mapConfig.base.toUpperCase();

    if (typeof mapConfig.port === "number") {
        return lookup.byExact.get(`${stationId}|${base}|${mapConfig.port}`) || null;
    }

    // Default behavior: if displayName is BASE-1, we can map from BASE without a port number.
    return lookup.byDefault.get(`${stationId}|${base}`) || null;
}

function mapStatusClass(statusCode) {
    if (statusCode === 1) {
        return "status-available";
    }
    if (statusCode === 2) {
        return "status-charging";
    }
    if (statusCode === 4) {
        return "status-offline";
    }
    return "status-occupied";
}

function updateStatusHistory(chargerId, nextStatusCode) {
    if (!statusHistory[chargerId]) {
        statusHistory[chargerId] = [];
    }

    const current = statusHistory[chargerId][statusHistory[chargerId].length - 1];
    if (!current || current.statusCode !== nextStatusCode) {
        statusHistory[chargerId].push({
            statusCode: nextStatusCode,
            timestamp: new Date()
        });
    }

    const latest = statusHistory[chargerId][statusHistory[chargerId].length - 1];
    const durationSeconds = Math.floor((new Date() - new Date(latest.timestamp)) / 1000);

    return `${Math.floor(durationSeconds / 3600)}h ${Math.floor((durationSeconds % 3600) / 60)}m`;
}

function legacyLabel(charger) {
    const serial = charger.stationCode.replace("BAE", "");
    if (charger.port) {
        return `${serial} | PORT-${charger.port}`;
    }
    return serial;
}

function createChargerElement(charger, mappedPort) {
    const chargerElement = document.createElement("div");
    chargerElement.className = "charger-status";

    if (!charger.map) {
        chargerElement.innerHTML = `
            <span class="indicator status-offline indicator-power-text">-</span>
            <span class="indicator-text">${legacyLabel(charger)}</span>
            <hr>
            <span class="indicator-status-text">[DROPPED]</span>
            <span class="indicator-duration-text">(n/a)</span>
        `;
        chargerElement.title = "No equivalent Chargehub port found";
        return chargerElement;
    }

    if (!mappedPort) {
        chargerElement.innerHTML = `
            <span class="indicator status-offline indicator-power-text">?</span>
            <span class="indicator-text">${legacyLabel(charger)}</span>
            <hr>
            <span class="indicator-status-text">[NOT FOUND]</span>
            <span class="indicator-duration-text">(n/a)</span>
        `;
        chargerElement.title = "Mapping exists but port not found in current Chargehub payload";
        return chargerElement;
    }

    const statusClass = mapStatusClass(mappedPort.statusCode);
    const powerText = (mappedPort.powerKwText || "").replace(" ", "");
    const statusText = (mappedPort.statusText || "Unknown").toUpperCase();
    const statusKey = mappedPort.netPortId || `${mappedPort.stationId}-${mappedPort.portId}`;
    const durationText = updateStatusHistory(statusKey, mappedPort.statusCode);

    chargerElement.innerHTML = `
        <span class="indicator ${statusClass} indicator-power-text">${powerText}</span>
        <span class="indicator-text">${legacyLabel(charger)}</span>
        <hr>
        <span class="indicator-status-text">[${statusText}]</span>
        <span class="indicator-duration-text">(${durationText})</span>
    `;
    chargerElement.title = `${mappedPort.voltText} ${mappedPort.ampText} | station ${mappedPort.stationId} | portId ${mappedPort.portId}`;

    return chargerElement;
}

function renderError(error) {
    const statusContainer = document.getElementById("status-container");
    statusContainer.innerHTML = `<p>Failed to fetch Chargehub data: ${error.message}</p>`;
    document.getElementById("update-time").textContent = new Date().toLocaleString();
}

async function fetchStatus() {
    try {
        await fetchLayoutConfig();
        const statusContainer = document.getElementById("status-container");
        statusContainer.innerHTML = "";

        const stationPayloads = await fetchChargehubData();
        const lookup = flattenPorts(stationPayloads);

        layoutConfig.locations.forEach((location) => {
            const locationElement = document.createElement("div");
            locationElement.className = "location";
            locationElement.innerHTML = `<h2>${location.locationName}</h2>`;

            location.chargers.forEach((charger) => {
                const mappedPort = resolveMappedPort(lookup, charger.map);
                const chargerElement = createChargerElement(charger, mappedPort);
                locationElement.appendChild(chargerElement);
            });

            statusContainer.appendChild(locationElement);
        });

        document.getElementById("update-time").textContent = new Date().toLocaleString();
    } catch (error) {
        renderError(error);
    }
}

async function initializePage() {
    await fetchStatus();
    const refreshMs = layoutConfig?.refreshMs || 300000;
    setInterval(fetchStatus, refreshMs);
}

async function refreshStatus() {
    await fetchStatus();
}

window.addEventListener("beforeunload", (event) => {
    const message = "Leaving or refreshing the page will reset the status timers. Are you sure you want to leave?";
    event.preventDefault();
    event.returnValue = message;
    return message;
});

initializePage();
