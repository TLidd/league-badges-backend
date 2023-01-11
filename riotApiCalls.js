import leaguePlayer from "./leagueClasses/leaguePlayer.js";
import championIds from './champions.js';
import { LolApi, Constants } from 'twisted';
import { matchDBHandler } from "./dbHandler.js";

const rApi = new LolApi({
    key: `${process.env.RIOT_KEY}`,
    rateLimitRetry: true,
    rateLimitRetryAttempts: 5,
    // debug: {
    //     logRatelimits: true
    // }
});

const riotMatchDB = new matchDBHandler();

export async function getSummoner(summonerName){  
    if(summonerName.length >= 3){
        try{
            let res = await rApi.Summoner.getByName(summonerName, Constants.Regions.AMERICA_NORTH);
            if(res) return res.response;
        } catch{
            return;
        }
    }
    return;
}

export async function getCurrentGame(summonerName){
    let summonerInfo = await getSummoner(summonerName);
    if(summonerInfo?.status){
        return summonerInfo;
    }
    if(summonerInfo){
        let data = {};
        try{
            data = await rApi.Spectator.activeGame(summonerInfo.id, Constants.Regions.AMERICA_NORTH);
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

export async function getPlayerHistory(summonerName){
    //get summoner puuid from name
    let summonerInfo = await getSummoner(summonerName);

    const puuid = summonerInfo?.puuid;

    const accId = summonerInfo?.id;

    //get ranked solo5v5 information for their rank and tier
    let accInfo = await rApi.League.bySummoner(accId, Constants.Regions.AMERICA_NORTH);

    //get match id list from puuid
    if(puuid){
        let matchIds;
        try{
            matchIds = (await rApi.MatchV5.list(puuid, Constants.RegionGroups.AMERICAS)).response;
        } catch(e){
            console.log(e.message);
        }

        let matches = [];
        if(matchIds){
            for(let i = 0; i < matchIds.length; i++){
                let matchInfo = await getMatchFromDB(matchIds[i]);
                if(!matchInfo){
                    matchInfo = await getMatchRiotAPI(matchIds[i]);
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

export async function getLobbyData(summonerName){
    let gameData = await getCurrentGame(summonerName);
    if(gameData?.participants){
        let lobbyData = await Promise.all(Object.values(gameData.participants).map(player => {
            return getPlayerHistory(player.summonerName);
        }))
        .catch(err => console.log(err));
        return {team1: lobbyData.slice(0,5), team2: lobbyData.slice(5,10)}
    }
}

export async function getLobbyNames(summonerName){
    let currentGame = await getCurrentGame(summonerName);
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
async function getMatchRiotAPI(matchId){
    let data = await rApi.MatchV5.get(matchId, Constants.RegionGroups.AMERICAS);
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