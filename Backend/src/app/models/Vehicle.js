import moongoose from 'mongoose';
const Schema = moongoose.Schema;

const Vehicle = new Schema({
    areaId: {
        type: Schema.Types.ObjectId,
        ref: 'areas',
        required: true
    },
    plateNumber: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true,
        default: 'AUS'
    },
    image: {
        type: String,
        required: true,
        default: "image.jpg"
    },
    datetime:{
        type: Date,
        default: null
    }
});

export default moongoose.model('vehicles', Vehicle)
