<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GameMessageSent
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $message;
    public $gameId;
    public $from;

    /**
     * Create a new event instance.
     */
    public function __construct($message, $gameId, $from)
    {
        $this->message = $message;
        $this->gameId = $gameId;
        $this->from = $from;
    }

    public function broadcastOn()
    {
        return new Channel("game.$this->gameId");
    }

    public function broadcastAs()
    {
        return 'message.sent';
    }

    public function broadcastWith()
    {
        return [
            'message' => $this->message,
            'from' => $this->from,
        ];
    }
}
