import championHistory from './leagueChampion.js';
import { createFBBadge, createBadgeList, getMainRole, orderObj } from './leagueDataFunctions.js';

class leaguePlayer{
    name = null;
    matchHistory = null;
    gamesPlayed = null;
    puuid = null;

    constructor(name, puuid, matchHistory){
        this.name = name;
        this.puuid = puuid;
        this.matchHistory = matchHistory;
        this.playerData.SummonerName = name;
        this.gamesPlayed = matchHistory.length;
        this.#processMatches();
    }

    playedRoles = {
        "TOP" : 0,
        "JUNGLE" : 0,
        "MIDDLE" : 0,
        "BOTTOM" : 0,
        "UTILITY" : 0,
    }

    /*badges are to describe the players playstyle
          (0-2) represents the level the player is at. example of aggro
          2 being a very aggressive player, 0 being a very passive player.*/
    
    playerData = {
        SummonerName: "",
        Role: "",
        badges: {},
        champions: {},
    }

    //process the data by getting the different badges to describe the player (ranked games only)
    #processMatches(){
        for(const match of this.matchHistory){
            if(match?.hasOwnProperty('info')){
                if(match?.info?.participants){
                    let player = this.#getPlayerMatchStats(match.info.participants);
                    if(player){
                        this.playedRoles[player.teamPosition] += 1;

                        let champion = player.championName;

                        if(this.playerData.champions[champion] === undefined){
                            this.playerData.champions[champion] = new championHistory(champion);
                        }

                        this.playerData.champions[champion].processChampData(match);
                    }
                }
            }
        }
        //after all matches processed create the data for the champions and players
        this.#createChampionData();
        this.#createPlayerData();
    }

    //get the data of the player from the player's match
    #getPlayerMatchStats(players){
        let playerStats = players.find(player => {
            if(player.puuid == this.puuid){
                return player;
            }else if(player.summonerName == this.name){
                return player;
            }
        });
        return playerStats;
    }

    // fill the PlayerData object with the champion stats/badges and create overall badges for the player
    #createPlayerData(){
        let data = null;
        for(const champion of Object.values(this.playerData.champions)){
            let championBadgeData = champion.getChampionBadgeData();
            if(data === null){
                data = championBadgeData;
            }
            else{
                for(const key of Object.keys(data)){
                    data[key] += championBadgeData[key];
                }
            }
        }
        if(data){
            this.playerData.badges = createBadgeList(data, this.gamesPlayed);

            let fbBadgeLevel = createFBBadge(data.firstBloods, this.gamesPlayed);
            if(fbBadgeLevel >= 0){
                this.playerData.badges.firstBloods = fbBadgeLevel;
            }
        }

        this.playerData.Role = getMainRole(this.playedRoles);
        this.playerData.badges = orderObj(this.playerData.badges);
        this.playerData.champions = this.#orderChamps();
    }

    //create the badges and stats of the champions played
    #createChampionData(){
        for(const champion of Object.values(this.playerData.champions)){
            champion.createChampionBadges();
            champion.createChampStats();
        }
    }

    getPlayerData(){
        return this.playerData;
    }

    #orderChamps(){
        return Object.entries(this.playerData.champions).sort(([,a], [,b]) => b.champData.gamesPlayed - a.champData.gamesPlayed).reduce((r, [k, v]) => ({ ...r, [k]: v }), {});
    }

    printData(){
        console.log(JSON.stringify(this.playerData, null, 4));
    }
}

export default leaguePlayer;