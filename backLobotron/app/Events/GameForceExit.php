<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GameForceExit implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $gameId;
    public string $reason;

    public function __construct($gameId, $reason = "deleted")
    {
        $this->gameId = $gameId;
        $this->reason = $reason;
    }
        public function broadcastOn()
    {
        return new Channel("game.{$this->gameId}");
    }

    public function broadcastAs()
    {
        return "game.force-exit";
    }

    public function broadcastWith()
    {
        return [
            'gameId' => $this->gameId,
            'reason' => $this->reason
        ];
    }
}
