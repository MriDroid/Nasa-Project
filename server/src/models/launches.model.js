const axios = require('axios');
const launches = require('./launches.mongo');
const planets = require('./planets.mongo');

const launch = {
	flightNumber: 100, // flight_number
	mission: 'Kepler Exploration X', // name
	rocket: 'Explorer IS1', // rocket.name
	launchDate: new Date('December 27, 2030'), // date_local
	target: 'Kepler-442 b', // not applicable
	customers: ['ZTM', 'NASA'], // payloads.customers
	upcoming: true, // upcoming
	success: true, // success
};

saveLaunch(launch);

const SPACEX_API_URL = 'https://api.spacexdata.com/v4/launches/query';

async function populateLaunches() {
	console.log('Downloading launch data ...!');
	const response = await axios.post(SPACEX_API_URL, {
		query: {},
		options: {
			pagination: false,
			populate: [
				{
					path: 'rocket',
					select: {
						name: 1,
					},
				},
				{
					path: 'payloads',
					select: {
						customers: 1,
					},
				},
			],
		},
	});
	if (response.status !== 200) {
		console.log('Problem downloading launches');
		throw new Error('Launch data download failed');
	}
	const launchDocs = response.data.docs;
	for (const launchDoc of launchDocs) {
		const payloads = launchDoc.payloads;
		const customers = payloads.flatMap((payload) => {
			return payload.customers;
		});
		const launch = {
			flightNumber: launchDoc['flight_number'],
			mission: launchDoc.name,
			rocket: launchDoc.rocket.name,
			launchDate: launchDoc['date_local'],
			// target: 'Kepler-442 b', // not applicable
			upcoming: launchDoc.upcoming,
			success: launchDoc.success,
			customers,
		};
		console.log(`${launch.flightNumber} ${launch.mission}`);
		await saveLaunch(launch);
	}
}

async function loadLaunchesData() {
	const firstLaunch = await findLaunch({
		flightNumber: 1,
		rocket: 'Falcon 1',
		mission: 'FalconSat',
	});
	if (firstLaunch) {
		console.log('Launch data already loaded!');
	} else {
		await populateLaunches();
	}
}

async function getLatestFlightNumber() {
	const lastLaunch = await launches.findOne().sort('-flightNumber');
	if (!lastLaunch) {
		return 0;
	}
	return lastLaunch.flightNumber;
}

async function getAllLaunches(skip, limit) {
	return await launches
		.find({}, '-_id -__v')
		.sort({ flightNumber: 1 })
		.skip(skip)
		.limit(limit);
}

async function saveLaunch(launch) {
	await launches.findOneAndUpdate(
		{
			flightNumber: launch.flightNumber,
		},
		launch,
		{
			upsert: true,
		}
	);
}

async function scheduleNewLaunch(launch) {
	const planet = await planets.findOne({
		keplerName: launch.target,
	});
	if (!planet) {
		throw new Error('No matching planet found');
	}
	const newFlightNumber = (await getLatestFlightNumber()) + 1;
	const newLaunch = Object.assign(launch, {
		flightNumber: newFlightNumber,
		customers: ['Zero To Mastery', 'NASA'],
		upcoming: true,
		success: true,
	});
	await saveLaunch(newLaunch);
}

async function abortLaunchById(launchId) {
	const aborted = await launches.updateOne(
		{
			flightNumber: launchId,
		},
		{
			upcoming: false,
			success: false,
		}
	);
	return aborted.modifiedCount === 1;
}

async function findLaunch(filter) {
	return await launches.findOne(filter);
}

async function existsLaunchById(launchId) {
	return await findLaunch({ flightNumber: launchId });
}

module.exports = {
	loadLaunchesData,
	getAllLaunches,
	scheduleNewLaunch,
	abortLaunchById,
	existsLaunchById,
};
