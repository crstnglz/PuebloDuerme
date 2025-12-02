<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GameMessageSent implements ShouldBroadcast
{
    use Dispatchable, SerializesModels;

   public $message;
    public $from;
    public $gameId;

     public function __construct($message, $from, $gameId)
    {
        $this->message = $message;
        $this->from = $from;
        $this->gameId = $gameId;
    }

    // Canal público "chat"
    public function broadcastOn(): Channel
    {
        return new Channel('game.' . $this->gameId);
    }

    // Nombre del evento en el cliente
    public function broadcastAs(): string
    {
        return 'message.sent';
    }

    // Datos que se envían al cliente
    public function broadcastWith(): array
    {
        return [
            'message' => $this->message,
            "from" => $this->from,
        ];
    }
}
