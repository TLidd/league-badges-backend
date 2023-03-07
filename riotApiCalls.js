import leaguePlayer from "./leagueClasses/leaguePlayer.js";
import championIds from './champions.js';
import { LolApi, Constants } from 'twisted';
import { matchDBHandler } from "./database/dbHandler.js";

const rApi = new LolApi({
    key: `${process.env.RIOT_KEY}`,
    rateLimitRetry: true,
    rateLimitRetryAttempts: 5,
    // debug: {
    //     logRatelimits: true
    // }
});

const riotMatchDB = new matchDBHandler();

const regionIDS = Object.freeze({
    "NA": Constants.Regions.AMERICA_NORTH,
    "BR": Constants.Regions.BRAZIL,
    "EUNE": Constants.Regions.EU_EAST,
    "EUW": Constants.Regions.EU_WEST,
    "JP": Constants.Regions.JAPAN,
    "KR": Constants.Regions.KOREA,
    "LA1": Constants.Regions.LAT_NORTH,
    "LA2": Constants.Regions.LAT_SOUTH,
    "OCE": Constants.Regions.OCEANIA,
    "RU": Constants.Regions.RUSSIA,
    "TR": Constants.Regions.TURKEY,
});

const regionCluster = Object.freeze({
    "NA": Constants.RegionGroups.AMERICAS,
    "BR": Constants.RegionGroups.AMERICAS,
    "EUNE": Constants.RegionGroups.EUROPE,
    "EUW": Constants.RegionGroups.EUROPE,
    "JP": Constants.RegionGroups.ASIA,
    "KR": Constants.RegionGroups.ASIA,
    "LA1": Constants.RegionGroups.AMERICAS,
    "LA2": Constants.RegionGroups.AMERICAS,
    "OCE": Constants.RegionGroups.SEA,
    "RU": Constants.RegionGroups.EUROPE,
    "TR": Constants.RegionGroups.EUROPE,
})

export async function getSummoner(summonerName, region){  
    if(summonerName.length >= 3){
        try{
            let res = await rApi.Summoner.getByName(summonerName, regionIDS[region]);
            if(res) return res.response;
        } catch{
            return;
        }
    }
    return;
}

export async function getCurrentGame(summonerName, region){
    let summonerInfo = await getSummoner(summonerName, region);
    if(summonerInfo?.status){
        return summonerInfo;
    }
    if(summonerInfo){
        let data = {};
        try{
            data = await rApi.Spectator.activeGame(summonerInfo.id, regionIDS[region]);
            data = data.response;
            data.summonerName = summonerInfo.name;
            return data;
        } catch{
            data.summonerName = summonerInfo.name;
            data.status = { message: 'Data not found', status_code: 404 };
            return data;
        }
    }
}

export async function getPlayerHistory(summonerName, region){
    //get summoner puuid from name
    let summonerInfo = await getSummoner(summonerName, region);
    if(summonerInfo == undefined) return

    const puuid = summonerInfo?.puuid;

    const accId = summonerInfo?.id;

    //get ranked solo5v5 information for their rank and tier
    let accInfo = await rApi.League.bySummoner(accId, regionIDS[region]);

    //get match id list from puuid
    if(puuid){
        let matchIds;
        try{
            matchIds = (await rApi.MatchV5.list(puuid, regionCluster[region], {queue: 420, count: 12})).response;
        } catch(e){
            console.log(e.message);
        }

        let matches = [];
        if(matchIds){
            for(let i = 0; i < matchIds.length; i++){
                let matchInfo = await getMatchFromDB(matchIds[i]);
                if(!matchInfo){
                    matchInfo = await getMatchRiotAPI(matchIds[i], region);
                }
                matches.push(matchInfo);
            }
        }

        //accInfo[0] is the ranked solo 5v5 accInfo[1] is flex 5v5
        let tier = null;
        let rank = null;
        if(accInfo){
            let playerAccInfo;
            accInfo.response.map(type => {
                if(type.queueType == "RANKED_SOLO_5x5") playerAccInfo = type;
            })

            if(playerAccInfo){
                tier = playerAccInfo.tier;
                rank = playerAccInfo.rank;
            }
        }
        let player = new leaguePlayer(summonerInfo.name, puuid, matches, tier, rank);
        return player.getPlayerData();
    }
}

export async function getLobbyNames(summonerName, region){
    let currentGame = await getCurrentGame(summonerName, region);
    if(currentGame?.status){
        return currentGame;
    }
    if(currentGame?.participants){
        let lobby = currentGame.participants.map(player => {
            return [player.summonerName, championIds[player.championId]];
        });
        return lobby;
    }
}

/**
 * Gets the match data from the Riot Api and inputs it into the database.
 * @param {string} matchId 
 * @returns match data
 */
async function getMatchRiotAPI(matchId, region){
    let data = await rApi.MatchV5.get(matchId, regionCluster[region]);
    riotMatchDB.inputMatch(matchId, data.response);
    return data.response;
}

/**
 * Gets the match data from the database.
 * @param {string} matchId 
 * @returns match data
 */
async function getMatchFromDB(matchId){
    let data = await riotMatchDB.getMatch(matchId);
    return data;
}