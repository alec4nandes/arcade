import lune from "lune";
import { useEffect, useState } from "react";

export default function MoonAndTides({ localData, setLocalData }) {
    const [moonData, setMoonData] = useState();

    useEffect(() => {
        let phases = lune.phase_hunt();
        const nextNewMoon = new Date(phases.nextnew_date),
            fullMoon = new Date(phases.full_date);
        if (fullMoon.getTime() > new Date().getTime()) {
            setMoonData({ nextNewMoon, nextFullMoon: fullMoon });
            return;
        }
        const dayAfterNew = new Date(
            nextNewMoon.getFullYear(),
            nextNewMoon.getMonth(),
            nextNewMoon.getDate() + 1
        );
        phases = lune.phase_hunt(dayAfterNew);
        setMoonData({ nextNewMoon, nextFullMoon: phases.full_date });
    }, []);

    function getLocalData() {
        navigator.geolocation.getCurrentPosition(handleLocalData);
    }

    async function handleLocalData(position) {
        setLocalData();
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

    async function getSolarData({ latitude, longitude }) {
        const response =
                await fetch(`https://api.sunrise-sunset.org/json?lat=${latitude}&lng=${longitude}
        `),
            solar = await response.json();
        return solar.results;
    }

    function getTides({ isLow }) {
        return (
            <>
                {isLow ? "low" : "high"} tides:{" "}
                {localData.tides
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

    function formatMoonDate(moonDate) {
        return moonDate && `${formatDate(moonDate)} at ${formatTime(moonDate)}`;
    }

    function padder(int) {
        return ("" + int).padStart(2, "0");
    }

    function formatTime(time) {
        const hour = padder(time.getHours()),
            minute = padder(time.getMinutes()),
            second = padder(time.getSeconds());
        return `${hour % 12 || 12}:${minute}:${second} ${
            hour < 12 ? "am" : "pm"
        }`;
    }

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
        <div className="moon-and-tides">
            <p>{formatTodaysDate()}</p>
            <p>
                <strong>the moon:</strong>
            </p>
            <ul>
                {moonData &&
                    Object.entries(moonData)
                        .sort((a, b) => a[1].getTime() - b[1].getTime())
                        .map(([key, value]) => (
                            <li key={key}>
                                next {key.includes("Full") ? "full" : "new"}{" "}
                                moon: {formatMoonDate(value)}
                            </li>
                        ))}
            </ul>
            <p>
                <strong>tides and other local stats:</strong>
            </p>
            {localData && (
                <>
                    <p>
                        <a
                            href={`https://www.google.com/maps/@${localData.coords.latitude},${localData.coords.longitude},15z`}
                            target="_blank"
                            rel="noreferrer"
                        >
                            coordinates
                        </a>
                    </p>
                    <ul>
                        <li>latitude: {localData.coords.latitude}</li>
                        <li>longitude: {localData.coords.longitude}</li>
                    </ul>
                    <p>tides</p>
                    <ul>
                        <li>{getTides({ isLow: true })}</li>
                        <li>{getTides({ isLow: false })}</li>
                        <li>
                            nearest station:{" "}
                            <a
                                href={`https://www.google.com/maps/@${localData.nearestStation.lat},${localData.nearestStation.lng},15z`}
                                target="_blank"
                                rel="noreferrer"
                            >
                                {localData.nearestStation.name}
                            </a>
                            <ul>
                                <li>
                                    latitude: {localData.nearestStation.lat}
                                </li>
                                <li>
                                    longitude: {localData.nearestStation.lng}
                                </li>
                            </ul>
                        </li>
                    </ul>
                    <p>sun</p>
                    <ul>
                        <li>
                            sunrise: {formatSunTime(localData.solar.sunrise)}
                        </li>
                        <li>
                            solar noon:{" "}
                            {formatSunTime(localData.solar.solar_noon)}
                        </li>
                        <li>sunset: {formatSunTime(localData.solar.sunset)}</li>
                    </ul>
                </>
            )}
            <button onClick={getLocalData}>
                <strong>{localData ? "refresh" : "get"} local data</strong>
            </button>
        </div>
    );
}
