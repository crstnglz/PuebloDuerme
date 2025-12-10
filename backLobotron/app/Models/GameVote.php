<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GameVote extends Model
{
    protected $fillable = [
        'game_id',
        'voter_id',
        'target_id',
        'phase_type',
        'turn_number',
    ];
}
