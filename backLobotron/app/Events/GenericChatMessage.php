<?php
// app/Events/GenericChatMessage.php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GenericChatMessage implements ShouldBroadcast
{
    use Dispatchable, SerializesModels;

    public int $gameId;
    public string $from;
    public string $message;

    public function __construct(int $gameId, string $from, string $message)
    {
        $this->gameId = $gameId;
        $this->from = $from;
        $this->message = $message;
    }

    public function broadcastOn()
    {
        return new Channel("game.{$this->gameId}");
    }

    public function broadcastAs()
    {
        return 'messageBots.sent';
    }

    public function broadcastWith()
    {
        return [
            'from' => $this->from,
            'message' => $this->message
        ];
    }
}
