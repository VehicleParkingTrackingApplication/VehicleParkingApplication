import User from '../models/User.js';
import Business from '../models/Business.js';

class accountController {
    async index(req, res) {
        try {
            // Get user ID from the authenticated request
            const userId = req.user.id;
            
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
            }

            // Fetch user data from database, excluding password
            const user = await User.findById(userId).select('-password');
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Return user account data
            res.json({
                success: true,
                message: 'Account data retrieved successfully',
                data: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    businessId: user.businessId,
                    createAt: user.createAt,
                    updateAt: user.updateAt
                }
            });
        } catch (error) {
            console.error('Error fetching account data:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    
    async inputBusiness(req, res) {
        try {
            console.log(req.body);
            const {email, phoneNumber, businessName, location} = req.body;

            // add conditions to validate the requirement
            // if (!conpanyName || !email || !phoneNumber) {
            //     return res.status(400).json({
            //         success: false,
            //         message: 'Business name and parking area are required'
            //     });
            // }

            // check if the email already exist with another business
            const existingBusiness = await Business.findOne({ email: email.trim() });
            if (existingBusiness) {
                return res.status(400).json({
                    sucess: false,
                    message: 'Email was registered with another business!'
                })
            }

            const newBusiness = new Business({
                email: email,
                phoneNumber: phoneNumber,
                businessName: businessName.trim(),
                location: location,
            })
            
            // save newBusiness that created to database
            const saveBusiness = await newBusiness.save();
            
            res.status(201).json({
                success: true,
                message: 'Business information saved successfully',
                data: {
                    id: saveBusiness._id,
                    businessName: saveBusiness.businessName,
                }
            })
        } catch (error) {
            console.log('Error in input business:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    async updateName(req, res) {
        try {
            // get own user id
            const userID = req.user.id;

            // retrieve data from request
            const firstName = req.body.firstName;
            const lastName = req.body.lastName;

            if (!firstName || !lastName) return res.status(400).json({ message:"Names cannot be empty" });

            const updatedUser = await User.findByIdAndUpdate(
                userID,
                {
                    $set: {firstName, lastName, updateAt: Date.now()}
                },
                {new: true}
            );

            if (!updatedUser) return res.status(404).json({
                success: false,
                message: 'User not found'
            });

            res.json({
                success: true,
                message: "Updated successfully"
            });

        } catch(err) {
            console.log('Error in accountController.updateName: ', err);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // async getCurrentUser(req, res) {
    //     try {
    //         const user = await User.findById(req.user.id).select('-password');
    //         if (!user) {
    //             return res.status(404).json({ message: 'User not found' });
    //         }
    //         res.json({ user });
    //     } catch (error) {
    //         res.status(500).json({ message: 'Error fetching user data' });
    //     }
    // }
}

export default new accountController();