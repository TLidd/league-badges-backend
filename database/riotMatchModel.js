import mongoose from 'mongoose';

const riotMatchSchema = new mongoose.Schema({
    matchId: {
        type: String,
        required: true,
        immutable: true,
    },
    matchInfo: {
        type: Object,
        required: true,
        immutable: true,
    }
});

export default mongoose.model("RiotMatches", riotMatchSchema, "RiotMatches");