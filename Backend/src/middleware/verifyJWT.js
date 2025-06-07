import jwt from 'jsonwebtoken';

const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'Access denied. No authorization header.' });
    }
    
    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decode) => {
        if (err) {
            console.log("CHECK ERRPOR", err);
            return res.sendStatus(400).json({ message: 'Invalid token.' }) //invalid token
        }
        req.user = decode;

        // TODO: deserialize -> if is a valid json object + exp > now() -> authenticated
        // {
        // “role”: string,  -> role based permissions
        // “Id”: string, -> user context for api
        // “exp”: number -> check expiration time, if expired -> request refresh token in exchange to an access token
        // }

        next();
    });
}

export default verifyJWT;