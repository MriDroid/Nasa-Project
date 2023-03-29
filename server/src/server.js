require('dotenv').config();
const http = require('http');
const app = require('./app');
const { mongoConnect } = require('./utils/mongo');
const { loadPlanetsData } = require('./models/planets.model');
const { loadLaunchesData } = require('./models/launches.model');

const PORT = process.env.PORT || 8000;

const server = http.createServer(app);

async function startServer() {
	await mongoConnect();
	await loadPlanetsData();
	await loadLaunchesData();

	server.listen(PORT, () => {
		console.log(`Server Listening to ${PORT} Port`);
	});
}

startServer();
