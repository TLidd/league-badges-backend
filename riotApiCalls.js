import leaguePlayer from "./leagueClasses/leaguePlayer.js";
import championIds from './champions.js'
import { LolApi, Constants } from 'twisted'

const rApi = new LolApi({
    key: `${process.env.RIOT_KEY}`,
    rateLimitRetry: true,
    rateLimitRetryAttempts: 5,
    // debug: {
    //     logRatelimits: true
    // }
});

export async function getSummoner(summonerName){
    let res;
    if(summonerName.length >= 3){
        res = await rApi.Summoner.getByName(summonerName, Constants.Regions.AMERICA_NORTH);
        return res.response;
    }
    // let summonerInfo;
    // if(summonerName.length >= 3){
    //     summonerInfo = await rLimiter.getFetchData(`https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${summonerName}?api_key=${process.env.RIOT_KEY}`);
    // }
    // return summonerInfo;
    return res;
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
            return data;
        }
        // let data = await rApi.Spectator.activeGame(summonerInfo.accountId, Constants.Regions.AMERICA_NORTH);
        // console.log(data);
        // let data = await rLimiter.getFetchData(`https://na1.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${summonerInfo.id}?api_key=${process.env.RIOT_KEY}`);
        // data.summonerName = summonerInfo.name;
        // return data.response;
    }
}

export async function getPlayerHistory(summonerName){
    //get summoner puuid from name
    let summonerInfo = await getSummoner(summonerName);
    // let summonerInfo = await rLimiter.getFetchData(`https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${summonerName}?api_key=${process.env.RIOT_KEY}`);

    const puuid = summonerInfo?.puuid;

    const accId = summonerInfo?.id;

    //get ranked solo5v5 information for their rank and tier
    let accInfo = await rApi.League.bySummoner(accId, Constants.Regions.AMERICA_NORTH);
    // let accInfo = await rLimiter.getFetchData(`https://na1.api.riotgames.com/lol/league/v4/entries/by-summoner/${accId}?api_key=${process.env.RIOT_KEY}`);

    //get match id list from puuid
    if(puuid){
        let matchIds = await rApi.MatchV5.list(puuid, Constants.Regions.AMERICA_NORTH);
        console.log(matchIds);
        // let matchIds = await rLimiter.getFetchData(`https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?queue=420&count=6&api_key=${process.env.RIOT_KEY}`);

        let matches;
        if(matchIds){
            matches = await Promise.all(Object.values(matchIds).map(matchId => {
                return (rApi.MatchV5.get(matchId, Constants.Regions.AMERICA_NORTH)).response;
                // return rLimiter.getFetchData(`https://americas.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${process.env.RIOT_KEY}`);
            }))
            .catch(err => console.log(err));
        }

        //accInfo[0] is the ranked solo 5v5 accInfo[1] is flex 5v5
        let tier = null;
        let rank = null;
        if(accInfo){
            let playerAccInfo;
            accInfo.map(type => {
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