<?php

namespace App\Events;

use App\Models\Game;
use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel; 
use Illuminate\Contracts\Broadcasting\ShouldBroadcast; 
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PlayerJoined implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $gameId;
    public $user;

    public function __construct(Game $game, User $user)
    {
        $this->gameId = $game->id;
        // Solo enviamos lo necesario para pintar el avatar
        $this->user = $user->only(['id', 'nickname', 'profile_photo']);
    }

    public function broadcastOn(): array
    {
        // Emitimos en el canal privado de la partida
        return [
            new PrivateChannel('games.' . $this->gameId),
        ];
    }
    
    // Nombre del evento que escucharemos en el frontend
    public function broadcastAs()
    {
        return 'player.joined';
    }
}