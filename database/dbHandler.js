import mongoose from 'mongoose';
import RiotMatch from './riotMatchModel.js';

mongoose.set("strictQuery", false);

mongoose.connect(process.env.MONGO_DB, () => {
    console.log("Connected to Mongo Database");
    },
    e => console.error(e)
);

export class matchDBHandler{
    
    /**
     * input the match info by using the riot match ID and the match json object from that match
     * @param {string} Id The Match ID.
     * @param {Object} matchInfo The Match Info JSON object.
     */
    async inputMatch(Id, matchInfo){
        try{
            await RiotMatch.create({
                matchId: Id,
                matchInfo: matchInfo,
            })
        } catch(e){
            console.log(e.message);
        }
    }

    /**
     * returns the database match info json object
     * @param {string} Id The Match ID.
     * @returns {Object} If match exists return JSON object.
     */
    async getMatch(Id){
        try{

            let entry = await RiotMatch.findOne({matchId: Id}, {'_id': false, '__v': false});

            if(entry) return entry.matchInfo;
            else return null;
            
        } catch(e){
            console.log(e.message);
        }
    }
}