export class Game 
{
    id: number
    name: string
    players: number
    status: string
    owner: { id: number; nickname: string }

    constructor(id: number, name: string, players: number, status: string, owner: { id:number, nickname: string })
    {
        this.id = id
        this.name = name
        this.players = players
        this.status = status
        this.owner = owner
    }
}