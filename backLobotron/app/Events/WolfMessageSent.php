<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class WolfMessageSent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $message;
    public $from;
    public $gameId;

    public function __construct($message, $from, $gameId)
    {
        $this->message = $message;
        $this->from = $from;
        $this->gameId = $gameId;
    }

    public function broadcastOn()
    {
        return new Channel("wolves.{$this->gameId}");
    }

    public function broadcastAs()
    {
        return "wolf.message"
    }
}
