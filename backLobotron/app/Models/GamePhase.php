<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GamePhase extends Model
{
    use HasFactory;

    protected $table = 'game_phases';

    protected $fillable = [
        'name',
        'duration_minutes',
    ];
    
    public function games(): HasMany
    {

        return $this->hasMany(Game::class, 'current_phase_id');
    }
}