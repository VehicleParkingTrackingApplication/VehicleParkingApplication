const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "CSIT321 Capstone Project API",
            version: "1.0.0",
            description: "API endpoints for the Smart Parking System"
        },
        servers: [
            {
                url: 'http://localhost:1313',
                description: "Development server"
            }
        ],
        components: {
            schemas: {
                User: {
                    type: "object",
                    properties: {
                        username: {
                            type: "string",
                            description: "Username of the user"
                        },
                        password: {
                            type: 'string',
                            description: 'Password of the user'
                        }
                    }
                },
                ParkingArea: {
                    type: "object",
                    properties: {
                        name: {
                            type: "string",
                            description: "Name of the parking are"
                        },
                        capacity: {
                            type: 'integer',
                            description: 'Total capacity of the parking area'
                        }
                    }
                }
            }
        }
    }
}