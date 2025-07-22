import request from 'supertest';
import express from 'express';
import homeController from '../app/controllers/home.js'

const app = express();
app.use(express.json());

app.get('/api/home', homeController.index);

describe('Home Controller', () => {
    describe('GET /api/home', () => {
        it('should return JSON response with "CHECK": "Hello"', async() => {
            const response = await request(app)
                .get('/api/home')
                .expect('Content-Type', /json/)
                .expect(200);
            expect(response.body).toEqual({ "Check": "Hello home page" });
        });

        it('shoud have correct response structure', async() => {
            const response = await request(app)
                .get('/api/home')
                .expect(200);
            expect(response.body).toHaveProperty('Check');
            expect(typeof response.body.Check).toBe('string');
            expect(response.body.Check).toBe('Hello home page');
        });
    });

    describe('Home Controller Methods', () => {
        it('should have index method that returns JSON', () => {
            const mockReq = {};
            const mockRes = {
                json: jest.fn().mockReturnThis(),
                status: jest.fn().mockReturnThis()
            };

            homeController.index(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({"Check": "Hello"});
        })
    })

    // describe('Error handling', () => {
    //     it('should return 404 for non-existent routes', async() => {
    //         await request(app)
    //             .get('/api/home/nonexistent')
    //             .expect(404);
    //     });

    //     it('should return 404 for wrong HTTP method', async () => {
    //         await request(app)
    //             .post('/api/home')
    //             .expect(404);
    //     });
    // });
});