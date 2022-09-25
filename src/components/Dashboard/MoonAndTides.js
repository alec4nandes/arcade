export default function MoonAndTides({ localData, setLocalData }) {
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

    function formatTodaysDate() {
        const date = new Date(),
            d = date.getDate(),
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

    function formatSunTime(sunTime) {
        const time = convertSunTime(sunTime),
            hour = time.getHours(),
            minute = time.getMinutes(),
            second = time.getSeconds();
        return `${hour % 12 || 12}:${minute}:${second} ${
            hour < 12 ? "am" : "pm"
        }`;
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
            {localData && (
                <>
                    <p>
                        coordinates: ({localData.coords.latitude},{" "}
                        {localData.coords.longitude})
                    </p>
                    <p>tides</p>
                    <ul>
                        <li>
                            nearest station: {localData.nearestStation.name} (
                            {localData.nearestStation.lat},{" "}
                            {localData.nearestStation.lng})
                        </li>
                        <li>{getTides({ isLow: true })}</li>
                        <li>{getTides({ isLow: false })}</li>
                    </ul>
                    <p>sun</p>
                    <ul>
                        <li>
                            sunrise: {formatSunTime(localData.solar.sunrise)}
                        </li>
                        <li>sunset: {formatSunTime(localData.solar.sunset)}</li>
                    </ul>
                </>
            )}
            <button onClick={getLocalData}>
                {localData ? "refresh" : "get"} local data
            </button>
        </div>
    );
}
