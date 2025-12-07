<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PhaseTransition implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;
    public int $gameId;
    public string $phaseName;
    public string $endTime;

    public function __construct(int $gameId, string $phaseName, string $endTime)
    {
        $this->gameId = $gameId;
        $this->phaseName = $phaseName;
        $this->endTime = $endTime;
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('game.' . $this->gameId),
        ];
    }
    
    public function broadcastAs(): string
    {
        return 'phase-changed';
    }
}