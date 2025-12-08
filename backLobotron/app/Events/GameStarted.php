<?php
namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GameStarted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $gameId;
    public string $phaseName;
    public string $endTime;

    public function __construct(int $gameId, string $phaseName = 'day', string $endTime = '')
    {
        $this->gameId = $gameId;
        $this->phaseName = $phaseName;
        $this->endTime = $endTime;
    }

    public function broadcastOn()
    {
        return new Channel("game.{$this->gameId}");
    }

    public function broadcastAs()
    {
        return "game.started";
    }

    public function broadcastWith()
    {
        return [
            'phaseName' => $this->phaseName,
            'endTime' => $this->endTime,
        ];
    }
}
