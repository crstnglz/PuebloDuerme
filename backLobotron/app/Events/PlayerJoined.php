<?php

namespace App\Events;

use App\Models\Game;
use App\Models\User;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel; 
use Illuminate\Contracts\Broadcasting\ShouldBroadcast; 
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PlayerJoined implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $gameId;
    public array $user; 

    public function __construct(Game $game, User $user)
    {
    
        $this->gameId = $game->id;

        $this->user = $user->only(['id', 'nickname', 'profile_photo']); 
    }

    public function broadcastOn(): array
    {
    
        return [
            new Channel('games.' . $this->gameId),
        ];
    }
    
    public function broadcastAs()
    {
        return 'player.joined';
    }
}