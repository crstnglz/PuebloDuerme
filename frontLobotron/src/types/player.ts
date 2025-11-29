import type { User } from "./user";

export interface GameUserPivot {
    id: number;         
    game_id: number;
    user_id: number;
    rol_id: number | null; 
    player_status: 'alive' | 'dead';
    is_sheriff: boolean;   
    has_heal_potion: boolean;
    has_kill_potion: boolean;
    used_cupid_ability: boolean;
    used_thief_ability: boolean;
    created_at?: string;
    updated_at?: string;
}


export interface Player extends User {
    pivot: GameUserPivot;
}