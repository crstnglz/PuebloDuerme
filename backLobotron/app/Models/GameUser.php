<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GameUser extends Model
{

    use HasFactory;

    protected $fillable = [
        'game_id',
        'user_id',
        'role_id',           
        'player_status',
        'is_sheriff',
        'has_heal_potion',    
        'has_kill_potion',
        'used_cupid_ability',
        'used_thief_ability',
    ];

    protected $casts = [
        'is_sheriff' => 'boolean',
        'has_heal_potion' => 'boolean',
        'has_kill_potion' => 'boolean',
        'used_cupid_ability' => 'boolean',
        'used_thief_ability' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function game()
    {
        return $this->belongsTo(Game::class);
    }


    public function user()
    {
        return $this->belongsTo(User::class);
    }


    public function role()
    {
    
        return $this->belongsTo(Role::class);
    }
}