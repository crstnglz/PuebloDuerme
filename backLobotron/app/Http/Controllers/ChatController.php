<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Events\GameMessageSent;

class ChatController extends Controller
{
    public function send(Request $request)
    {
        $request->validate([
            'game_id' => 'required|integer',
            'message' => 'required|string',
        ]);

        $gameId = $request->game_id;
        $msg = $request->message;
        $from = $request->user()->nickname ?? 'Jugador';

        event(new GameMessageSent($msg, $gameId, $from));

        return response()->json(['status' => 'ok']);
    }
}
