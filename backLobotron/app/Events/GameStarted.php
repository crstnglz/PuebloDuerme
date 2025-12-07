<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GameStarted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $gameId;

    /**
     * Create a new event instance.
     */
    public function __construct(int $gameId)
    {
        $this->gameId = $gameId;
    }
    public function broadcastOn()
    {
        return new PresenceChannel("game.{$this->gameId}");
    }

    public function broadcastAs()
    {
        return "game.started";
    }
}
