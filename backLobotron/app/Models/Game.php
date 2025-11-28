<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Game extends Model
{
    /** @use HasFactory<\Database\Factories\GameFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'owner_id',
        'max_players',
        'current_players',
        'status'
    ];

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }
public function players() // <--- NOMBRE CAMBIADO
{
    return $this->belongsToMany(User::class, 'game_users')
        ->using(GameUser::class)
        ->withPivot([
            'id',
            'role_id',
            'player_status',
            'is_sheriff',
            'has_heal_potion',
            'has_kill_potion',
            'used_cupid_ability',
            'used_thief_ability'
        ])
        ->withTimestamps();
}
}
