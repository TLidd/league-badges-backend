import { getMainRole, orderObj, createBadgeList, createFBBadge } from "./leagueDataFunctions.js";

export default class championHistory{

    champData = {
        champName: "",
        Role: "",
        badges: {},
        gamesPlayed: 0,
    }

    constructor(name){
        this.champData.champName = name;
    }

    #matchGamesData = {
        totalTeamKills: 0,
        totalTime: 0,
    }

    #matchTotals = {
        kills: 0,
        deaths: 0,
        assists: 0,
        firstBloods: 0,
        visionScore: 0,
        totalMinionsKilled: 0,
        damageDealtToTurrets: 0,
        totalDamageDealtToChampions: 0,
        totalDamageTaken: 0,
        wardsKilled: 0,
        goldEarned: 0,
        wins: 0,
    }

    #badgePoints = {
        visionScore: 0,
        totalMinionsKilled: 0,
        damageDealtToTurrets: 0,
        totalDamageDealtToChampions: 0,
        totalDamageTaken: 0,
        wardsKilled: 0,
        goldEarned: 0,
    }

    #playedRoles = {
        "TOP" : 0,
        "JUNGLE" : 0,
        "MIDDLE" : 0,
        "BOTTOM" : 0,
        "UTILITY" : 0,
    }

    processChampData(match){
        let players = match.info.participants;

        let champInfo = this.getChampGameInfo(players);

        let teamId = champInfo.teamId;
        this.#matchGamesData.totalTeamKills += this.getTeamKills(match.info.participants, teamId);

        this.#matchGamesData.totalTime += match.info.gameDuration;

        for(const key of Object.keys(this.#matchTotals)){
            if(key == 'wins'){
                this.#matchTotals[key] += champInfo[key] == true ? 1 : 0;
            }
            else if(key == 'firstBloods'){
                this.#matchTotals[key] += champInfo['firstBloodKill'] == true ? 1 : 0;
                this.#matchTotals[key] += champInfo['firstBloodAssist'] == true ? 1 : 0;  
            }
            else{
                this.#matchTotals[key] += champInfo[key];
            }
        }

        for(const key of Object.keys(this.#badgePoints)){
            this.#badgePoints[key] += this.getBadgePoints(players, key);
        }

        this.#playedRoles[champInfo.teamPosition] += 1;
        this.champData.gamesPlayed += 1;
    }

    getChampGameInfo(participants){
        return participants.find(participant => participant.championName == this.champData.champName);
    }

    getTeamKills(participants, teamId){
        let kills = 0;
        for(const participant of Object.values(participants)){
            if(participant.teamId == teamId){
                kills += participant.kills;
            }
        }
        return kills;
    }

    getBadgePoints(participants, key){
        let participantScores = [];
        let championScore;
        participants.forEach(participant => {
            participantScores.push(participant[key]);
            if(participant.championName == this.champData.champName){
                championScore = participant[key];
            }
        });

        participantScores.sort( (a, b) => {
            return a - b;
        });

        let index = participantScores.findIndex(element => championScore < element);
        if(index == -1) return 2;

        let pointPercentage = (index - 1) / participantScores.length;

        if(pointPercentage > .7){
            return 2;
        }
        else if(pointPercentage >= .5 && pointPercentage <= .7){
            return 1;
        }
        else{
            return 0;
        }
    }

    createChampionBadges(){
        if(this.champData.gamesPlayed > 0){
            this.champData.badges = createBadgeList(this.#badgePoints, this.champData.gamesPlayed);
            this.champData.badges.firstBloods = createFBBadge(this.#matchTotals.firstBloods, this.champData.gamesPlayed);
            this.champData.Role = getMainRole(this.#playedRoles);
            this.champData.badges = orderObj(this.champData.badges);
        }
    }

    getChampionBadgeData(){
        let badgeData = this.#badgePoints;
        badgeData.firstBloods = this.#matchTotals.firstBloods;
        badgeData.wins = this.#matchTotals.wins;
        return badgeData;
    }

    //create the stats that will be graphed onto the chart
    createChampStats(){
        let champStats = {}

        if(this.#matchTotals.kills + this.#matchTotals.assists != 0 || this.#matchGamesData.totalTeamKills != 0){
            champStats["Kill Participation"] = (((this.#matchTotals.kills + this.#matchTotals.assists) / this.#matchGamesData.totalTeamKills)*100).toFixed(0);
        }

        //goldPercent based off of the stats of bronze on the low end and challenger on the high end
        let goldPercent;
        let goldPerMin = ((this.#matchTotals.goldEarned / this.#matchGamesData.totalTime) * 60).toFixed(0); 
        if(goldPerMin < 275){
            goldPercent = 0
        }
        else if(goldPerMin >= 475){
            goldPercent = 100
        }
        else{
            goldPercent = (((goldPerMin - 275)/(475-275)) * 100).toFixed(0);
        }
        champStats["Gold Earned"] = goldPercent;

        //visionPercent based off of the stats of bronze on the low end and challenger on the high end
        let visionPercent;
        let visionPerMin = ((this.#matchTotals.visionScore / this.#matchGamesData.totalTime) * 60).toFixed(3);
        if(visionPerMin >= 1.5){
            visionPercent = 100;
        }
        else if(visionPerMin < 0.25){
            visionPercent = 0
        }
        else{
            visionPercent = (((visionPerMin - 0.25)/(1.5-0.25)) * 100).toFixed(0);
        }
        champStats["Vision Score"] = visionPercent;

        this.champData.champStats = champStats;
    }
}