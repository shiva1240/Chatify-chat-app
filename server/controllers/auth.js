const { connect } = require('getstream');
const bcrypt = require('bcrypt');
const StreamChat = require('stream-chat').StreamChat;
const crypto = require('crypto');

require('dotenv').config();

const api_key = process.env.STREAM_API_KEY;
const api_secret = process.env.STREAM_API_SECRET;
const app_id = process.env.STREAM_APP_ID;

const signup = async (req, res) => {
    try {
        const { fullName, username, password, phoneNumber } = req.body;

        const userId = crypto.randomBytes(16).toString('hex');

        const serverClient = connect(api_key, api_secret, app_id);

        const hashedPassword = await bcrypt.hash(password, 10);

        const token = serverClient.createUserToken(userId);

        res.status(200).json({ token, fullName, username, userId, hashedPassword, phoneNumber });
    } catch (error) {
        console.log(error);

        res.status(500).json({ message: error });
    }
};

const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log('Username:', username);
        console.log('Password:', password);

        // Ensure these variables are correctly set and not undefined
        const serverClient = connect(api_key, api_secret, app_id);
        const client = StreamChat.getInstance(api_key, api_secret);

        // Query for the user
        const { users } = await client.queryUsers({ name: username });

        // Check if user exists
        if (!users.length) return res.status(400).json({ message: 'User not found' });

        // Check if hashedPassword exists
        const hashedPassword = users[0].hashedPassword;
        console.log('Hashed Password:', hashedPassword);
        if (!hashedPassword) {
            return res.status(500).json({ message: 'Hashed password not found' });
        }

        // Compare passwords
        const success = await bcrypt.compare(password, users[0].hashedPassword);

        // Create token
        const token = serverClient.createUserToken(users[0].id);

        // If password matches, return success response
        if (success) {
            res.status(200).json({ token, fullName: users[0].fullName, username, userId: users[0].id });
        } else {
            res.status(401).json({ message: 'Incorrect password' }); // Changed to 401 for unauthorized
        }
    } catch (error) {
        console.error('Error during login:', error); // Added a more descriptive error log

        // Send the error message
        res.status(500).json({ message: error.message });
    }
};


module.exports = { signup, login }












