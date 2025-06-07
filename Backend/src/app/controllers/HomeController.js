import User from '../models/userSchema.js';
import Camera_Data from '../models/cameraDataSchema.js';
import bcrypt from 'bcrypt';

import importCSVData from '../../utils/dataImport.js';
import businessImport from '../../utils/businessImport.js';
import parkingAreaImport from '../../utils/parkingAreaImport.js';

import jwt from 'jsonwebtoken';
import fsPromiseses from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

class homeController {
    index(req, res, next) {
        console.log('Session user:', req.session.user);
        res.render('homepage/home', {
            user: req.session.user
        });
    }
    
    async importData(req, res) {
        try {
            const filename = req.query.file || '2025-04-02.csv';
            const results = await importCSVData(filename);
            console.log(results);
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }

    }
    async importBusinessData(req, res) {
        try {
            const results = await businessImport();
            console.log(results);
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async importParkingAreaData(req, res) {
        try {
            const results = await parkingAreaImport(req, res);
            console.log(results);
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    show(req, res) {
        res.render('homepage/show');
    }
}

export default new homeController();
