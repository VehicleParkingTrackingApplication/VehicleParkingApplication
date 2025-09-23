import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const FtpServerSchema = new Schema({
    host: { type: String, required: true },
    port: { type: Number, default: 21 },
    user: { type: String, requried: true },
    password: { type: String, required: true }, // encrypt this
    secure: { type: Boolean, default: true},
    secureOptions: {
        rejectUnauthorized: { type: Boolean, default: false }
    },
    folder: { type: String, default: '' },
});

export default mongoose.model('ftpservers', FtpServerSchema);