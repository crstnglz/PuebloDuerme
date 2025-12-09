import type { Player } from "./player";
import type { GamePhaseInterface } from "./gamePhaseInterface";

export interface GameInterface {
    id: number; 
    name: string;
    owner_id: number; 
    max_players: number; 
    current_players: number;
    status: 'esperando' | 'en curso' | 'finalizado';
    turn: number;
    join_code?: string; 
    winning_team?: string; 
    owner: Player; 
    players?: Player[];
    created_at?: string;
    updated_at?: string;
    current_phase?: GamePhaseInterface;
    phase_ends_at?: string;
    
}