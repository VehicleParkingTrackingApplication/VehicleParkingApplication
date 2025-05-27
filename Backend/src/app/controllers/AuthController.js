// // controllers/AuthController.js
// import User from '../models/User.js';

// import bcrypt from 'bcrypt';
// import jwt from 'jsonwebtoken';

// class AuthController {
//   login(req, res) {
//     res.render('homepage/login');
//   }
//   async loginPost(req, res) {
//     const data = {
//       username: req.body.username,
//       password: req.body.password,
//     };
//     if (!data.username || !data.password) {
//       return res
//         .status(400)
//         .json({ message: 'Please enter username and password.' });
//     }
//     // Check whether the username and password are correct

//     const checkUsername = await User.findOne({ userName: data.username });
//     if (!checkUsername) {
//       res.send('Username does not exist. Please register first.');
//     } else {
//       const checkPassword = bcrypt.compare(
//         data.password,
//         checkUsername.password,
//       );
//       if (checkPassword) {
//         // Create JWTs
//         const accessToken = jwt.sign(
//           { user: checkUsername.userName },
//           process.env.ACCESS_TOKEN_SECRET,
//           { expiresIn: '5m' },
//         );
//         const refreshToken = jwt.sign(
//           { user: checkUsername.userName },
//           process.env.REFRESH_TOKEN_SECRET,
//           { expiresIn: '1d' },
//         );
//         req.session.checkUsername = checkUsername;
//         res.redirect('/');
//       } else {
//         res.send('Incorrect password. Please try again.');
//       }
//     }
//   }
//   async register(req, res) {
//     res.render('homepage/register');
//   }
//   async registerPost(req, res) {
//     const data = {
//       userName: req.body.username,
//       password: req.body.password,
//     };
//     // Check whether the usernaem already exists in database
//     const existingUser = await User.findOne({ userName: data.userName });
//     if (existingUser) {
//       res.send('User already exists. Please choose a different username.');
//     } else {
//       // if username is not exist, then hash the password and save to the database
//       const saltRounds = 10;
//       const hashedPassword = await bcrypt.hash(data.password, saltRounds);
//       data.password = hashedPassword;
//     }
//     const userData = await User.insertMany(data);
//     res.redirect('/login');
//   }
//   logout(req, res) {
//     req.session.destroy((err) => {
//       if (err) 
//         return res.redirect('/');
//       res.clearCookie('connect.sid');
//       res.redirect('/account/login');
//     });
//   }
// }
// export default new AuthController();
