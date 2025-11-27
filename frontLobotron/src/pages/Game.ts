export class Game 
{
    id: number
    name: string
    players: number
    status: string

    constructor(id: number, name: string, players: number, status: string)
    {
        this.id = id
        this.name = name
        this.players = players
        this.status = status
    }
}