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
                    phoneNumber: user.phoneNumber,
                    address: user.address,
                    role: user.role,
                    businessId: user.businessId,
                    createAt: user.createAt,
                    updateAt: user.updateAt,
                    profileCompleted: user.profileCompleted
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    
    async inputBusiness(req, res) {
        try {
            const {email, phoneNumber, businessName, location} = req.body;

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
            const phoneNumber = req.body.phoneNumber;
            const address = req.body.address;

            if (!firstName || !lastName) return res.status(400).json({ message:"Names cannot be empty" });

            const updatedUser = await User.findByIdAndUpdate(
                userID,
                {
                    $set: {firstName, lastName, phoneNumber, address, profileCompleted: true, updateAt: Date.now()}
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
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: err.message
            });
        }
    }

    async listUsersInBusiness(req, res) {
        try {
            const requesterRole = req.user.role;
            const businessId = req.user.businessId;

            if (!businessId) {
                return res.status(400).json({ success: false, message: 'Business ID missing' });
            }
            if (String(requesterRole).toLowerCase() !== 'admin') {
                return res.status(403).json({ success: false, message: 'Access denied' });
            }

            const users = await User.find({ businessId })
                .select('_id username email firstName lastName role businessId createdAt updatedAt phoneNumber address');
            return res.status(200).json({ success: true, data: users });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
        }
    }
}

export default new accountController();