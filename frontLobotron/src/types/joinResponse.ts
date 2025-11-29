import type { GameInterface } from "./gameInterface";

interface JoinResponse {
    message: string;
    game: GameInterface;
}

export type { JoinResponse };