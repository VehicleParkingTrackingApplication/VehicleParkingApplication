import User from '../models/User.js';
import Business from '../models/Business.js';

class accountController {
    index(req, res) {
        return res.json({message: "Hello account"});
        // const user = req.session.checkUsername;
        // if (!user) {
        //     return res.redirect('/account/login');
        // }
        // return res.render('account', { 
        //     checkUsername: req.session.checkUsername,
        //     user: user
        // });
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