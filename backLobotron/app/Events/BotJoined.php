<?php

namespace App\Events;

use App\Models\Game;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class BotJoined implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $gameId;
    public array $bots;

    public function __construct(Game $game, array $bots)
    {
        $this->gameId = $game->id;
        $this->bots = $bots;
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('game.' . $this->gameId),
        ];
    }

    public function broadcastWith(): array
    {
        return ['bots' => $this->bots];
    }

    public function broadcastAs()
    {
        return 'bots.added';
    }
}
