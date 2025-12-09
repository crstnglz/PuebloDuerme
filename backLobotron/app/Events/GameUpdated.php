<?php

namespace App\Events;

use App\Models\Game;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GameUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $game;

    public function __construct(Game $game)
    {
        $this->game = $game->load('owner:id,nickname');
    }

    public function broadcastOn()
    {
        return new Channel('lobby');
    }

    public function broadcastAs()
    {
        return 'GameUpdated';
    }
}
