const request = require('supertest');
const app = require('../../app');
const { mongoConnect, mongoDisconnect } = require('../../utils/mongo');
const { loadPlanetsData } = require('../../models/planets.model');

describe('Test Launches API', () => {
	beforeAll(async () => {
		await mongoConnect();
		await loadPlanetsData;
	});

	afterAll(async () => {
		await mongoDisconnect();
	});

	describe('Test GET /launches', () => {
		test('It should respond with 200 success', async () => {
			const response = await request(app)
				.get('/v1/launches')
				.expect('Content-Type', /json/)
				.expect(200);
		});
	});
	describe('Test POST /launches', () => {
		const completeLaunchData = {
			mission: 'Mission 1',
			rocket: 'Rocket 1',
			target: 'Kepler-442 b',
			launchDate: 'January 1, 2030',
		};
		const launchDataWithInvalidDate = {
			mission: 'Mission 1',
			rocket: 'Rocket 1',
			target: 'Kepler-442 b',
			launchDate: 'Hello!',
		};
		const launchDataWithoutDate = {
			mission: 'Mission 1',
			rocket: 'Rocket 1',
			target: 'Kepler-442 b',
		};

		test('It should respond with 201 success', async () => {
			const response = await request(app)
				.post('/v1/launches')
				.send(completeLaunchData)
				.expect('Content-Type', /json/)
				.expect(201);

			const requestDate = new Date(
				completeLaunchData.launchDate
			).valueOf();
			const responseDate = new Date(response.body.launchDate).valueOf();

			expect(requestDate).toBe(responseDate);

			expect(response.body).toMatchObject(launchDataWithoutDate);
		});
		test('It should catch missing required properties', async () => {
			const response = await request(app)
				.post('/v1/launches')
				.send(launchDataWithoutDate)
				.expect('Content-Type', /json/)
				.expect(400);
			expect(response.body).toStrictEqual({
				error: 'Missing required launch property',
			});
		});
		test('It should catch invalid dates', async () => {
			const response = await request(app)
				.post('/v1/launches')
				.send(launchDataWithInvalidDate)
				.expect('Content-Type', /json/)
				.expect(400);
			expect(response.body).toStrictEqual({
				error: 'Invalid Date Format',
			});
		});
	});
});
