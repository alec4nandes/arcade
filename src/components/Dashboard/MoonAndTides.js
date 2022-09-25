import lune from "lune";
import { useEffect, useState } from "react";

export default function MoonAndTides({ localData, setLocalData }) {
    const [moonData, setMoonData] = useState();

    useEffect(() => {
        let phases = lune.phase_hunt();
        const currentPhase = lune.phase(),
            newMoon = new Date(phases.new_date),
            nextNewMoon = new Date(phases.nextnew_date),
            fullMoon = new Date(phases.full_date),
            currentTime = new Date().getTime(),
            result = {
                currentPhase,
                nextNewMoon:
                    newMoon.getTime() > currentTime ? newMoon : nextNewMoon,
            };
        if (fullMoon.getTime() > currentTime) {
            setMoonData({ ...result, nextFullMoon: fullMoon });
            return;
        }
        const dayAfterNew = new Date(
            nextNewMoon.getFullYear(),
            nextNewMoon.getMonth(),
            nextNewMoon.getDate() + 1
        );
        phases = lune.phase_hunt(dayAfterNew);
        setMoonData({ ...result, nextFullMoon: phases.full_date });
    }, [localData]);

    function getLocalData() {
        navigator.geolocation.getCurrentPosition(handleLocalData);
    }

    async function handleLocalData(position) {
        setLocalData();
        setMoonData();
        const { coords } = position,
            { latitude, longitude } = coords,
            stations = await getNOAAStations(),
            nearestStation = findNearestStation({
                stations,
                latitude,
                longitude,
            });
        setLocalData({
            coords,
            nearestStation,
            tides: await getTidesData(nearestStation),
            solar: await getSolarData({ latitude, longitude }),
        });
    }

    return (
        <div className="moon-and-tides">
            <p>{formatTodaysDate()}</p>
            <p>
                <strong>the moon:</strong>
            </p>
            {moonData && <MoonData {...{ moonData }} />}
            <p>
                <strong>tides and other local stats:</strong>
            </p>
            {localData && (
                <>
                    <Coordinates coords={localData.coords} />
                    <TidesData {...{ ...localData }} />
                    <SunData solarData={localData.solar} />
                </>
            )}
            <button onClick={getLocalData}>
                <strong>{localData ? "refresh" : "get"} local data</strong>
            </button>
        </div>
    );
}

/* FETCHING DATA */

async function getNOAAStations() {
    const response = await fetch(
            "https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations.json"
        ),
        { stations } = await response.json();
    return stations;
}

function findNearestStation({ stations, latitude, longitude }) {
    let shortestDistance, nearestStation;
    stations
        // only check tidal stations
        .filter((station) => station.tidal)
        .forEach((station) => {
            const { lat, lng } = station,
                distance = {
                    x: Math.abs(longitude - lng),
                    y: Math.abs(latitude - lat),
                };
            if (
                !shortestDistance ||
                (distance.x < shortestDistance.x &&
                    distance.y < shortestDistance.y)
            ) {
                shortestDistance = distance;
                nearestStation = station;
            }
        });
    return nearestStation;
}

async function getTidesData(nearestStation) {
    const response = await fetch(
            `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?date=today&product=predictions&datum=mllw&interval=hilo&format=json&units=metric&time_zone=lst_ldt&station=${nearestStation.id}`
        ),
        tides = await response.json();
    return tides.predictions;
}

async function getSolarData({ latitude, longitude, date }) {
    const response = await fetch(
        `https://api.sunrise-sunset.org/json?lat=${latitude}&lng=${longitude}${
            date ? `&date=${date}` : ""
        }`
    );
    let { results } = await response.json();
    if (
        !date &&
        results.sunrise.includes("PM") &&
        results.sunset.includes("AM")
    ) {
        // since the solar times are UTC, the readings can be a day off
        // in further out timezones, but this fixes that
        const d = new Date(),
            d2 = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
        results = await getSolarData({
            latitude,
            longitude,
            date: `${d2.getFullYear()}-${d2.getMonth() + 1}-${d2.getDate()}`,
        });
    }
    return results;
}

/* END FETCHING DATA */

/* CHILD COMPONENTS */

function MoonData({ moonData }) {
    const getPercentIlluminated = () =>
        (moonData.currentPhase.illuminated * 100).toFixed(2);

    function formatMoonDate(moonDate) {
        return moonDate && `${formatDate(moonDate)} at ${formatTime(moonDate)}`;
    }

    return (
        <ul>
            <li>
                illuminated: {getPercentIlluminated()}%
                <div className="moon-graphic">
                    <div
                        className="illuminated"
                        style={{
                            [moonData.currentPhase.phase < 0.5
                                ? "left"
                                : "right"]: 100 - getPercentIlluminated() + "%",
                        }}
                    ></div>
                </div>
            </li>
            <li>
                phase: {moonData.currentPhase.phase < 0.5 ? "waxing" : "waning"}
            </li>
            {Object.entries(moonData)
                .filter(([key]) => key !== "currentPhase")
                .sort((a, b) => a[1].getTime() - b[1].getTime())
                .map(([key, value]) => (
                    <li key={key}>
                        next {key.includes("Full") ? "full" : "new"} moon:{" "}
                        {formatMoonDate(value)}
                    </li>
                ))}
        </ul>
    );
}

function Coordinates({ coords }) {
    const { latitude, longitude } = coords;

    return (
        <>
            <p>
                <a
                    href={`https://www.google.com/maps/@${latitude},${longitude},15z`}
                    target="_blank"
                    rel="noreferrer"
                >
                    coordinates
                </a>
            </p>
            <ul>
                <li>latitude: {latitude}</li>
                <li>longitude: {longitude}</li>
            </ul>
        </>
    );
}

function TidesData({ tides, nearestStation }) {
    function displayTides({ isLow }) {
        return (
            <>
                {isLow ? "low" : "high"} tides:{" "}
                {tides
                    .filter((tide) => tide.type === (isLow ? "L" : "H"))
                    .map((tide) => tide.t.split(" ")[1])
                    .map((time) => {
                        const [hours, minutes] = time.split(":");
                        return `${hours % 12 || 12}:${minutes} ${
                            hours < 12 ? "am" : "pm"
                        }`;
                    })
                    .join(", ")}
            </>
        );
    }

    return (
        <>
            <p>tides</p>
            <ul>
                <li>{displayTides({ isLow: true })}</li>
                <li>{displayTides({ isLow: false })}</li>
                <li>
                    nearest station:{" "}
                    <a
                        href={`https://www.google.com/maps/@${nearestStation.lat},${nearestStation.lng},15z`}
                        target="_blank"
                        rel="noreferrer"
                    >
                        {nearestStation.name}
                    </a>
                    <ul>
                        <li>latitude: {nearestStation.lat}</li>
                        <li>longitude: {nearestStation.lng}</li>
                    </ul>
                </li>
            </ul>
        </>
    );
}

function SunData({ solarData }) {
    function formatSunTime(sunTime) {
        return formatTime(convertSunTime(sunTime));
    }

    function convertSunTime(sunTime, adjustDay) {
        const date = new Date(),
            time = new Date(
                `${date.getMonth() + 1}/${
                    date.getDate() + (adjustDay || 0)
                }/${date.getFullYear()} ${sunTime} UTC`
            ),
            compare = compareDates(date, time);
        return compare ? convertSunTime(sunTime, compare > 0 ? 1 : -1) : time;
    }

    function compareDates(date1, date2) {
        const day1 = getDay(date1),
            day2 = getDay(date2);
        return day1.getTime() - day2.getTime();
    }

    function getDay(date) {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }

    return (
        <>
            <p>sun</p>
            <ul>
                <li>sunrise: {formatSunTime(solarData.sunrise)}</li>
                <li>solar noon: {formatSunTime(solarData.solar_noon)}</li>
                <li>sunset: {formatSunTime(solarData.sunset)}</li>
            </ul>
        </>
    );
}

/* END CHILD COMPONENTS */

/* FORMATTING DATES */

function formatDate(date) {
    const d = date.getDate(),
        m = date.getMonth(),
        y = date.getFullYear(),
        months = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
        ];
    return `${months[m]} ${d}, ${y}`;
}

function formatTodaysDate() {
    return formatDate(new Date());
}

function padder(int) {
    return ("" + int).padStart(2, "0");
}

function formatTime(time) {
    const hour = padder(time.getHours()),
        minute = padder(time.getMinutes()),
        second = padder(time.getSeconds());
    return `${hour % 12 || 12}:${minute}:${second} ${hour < 12 ? "am" : "pm"}`;
}
