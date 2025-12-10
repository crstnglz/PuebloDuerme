<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Queue\SerializesModels;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Broadcasting\InteractsWithSockets;

class PlayerKilled implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $gameId;
    public int $userId;
    public string $phase;
    public ?string $roleName;
    public ?string $roleTeam;

    public function __construct(
        int $gameId,
        int $userId,
        string $phase,
        ?string $roleName,
        ?string $roleTeam
    ) {
        $this->gameId   = $gameId;
        $this->userId   = $userId;
        $this->phase    = $phase;
        $this->roleName = $roleName;
        $this->roleTeam = $roleTeam;
    }

    public function broadcastOn(): Channel
    {
        return new Channel("game.{$this->gameId}");
    }

    public function broadcastAs(): string
    {
        return 'player.killed';
    }
}
