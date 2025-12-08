<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PlayerLeftGame implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $gameId;
    public int $userId;
    public string $username;
    public int $remainingPlayers;

    public function __construct($gameId, $userId, $username, $remainingPlayers)
    {
        $this->gameId = $gameId;
        $this->userId = $userId;
        $this->username = $username;
        $this->remainingPlayers = $remainingPlayers;
    }

    public function broadcastOn()
    {
        return new Channel("game.{$this->gameId}");
    }

    public function broadcastAs()
    {
        return 'player.left';
    }

    public function broadcastWith()
    {
        return [
            'gameId' => $this->gameId,
            'userId' => $this->userId,
            'username' => $this->username,
            'remainingPlayers' => $this->remainingPlayers
        ];
    }
}
