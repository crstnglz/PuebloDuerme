<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Events\GameMessageSent;

class ChatController extends Controller
{
      public function send(Request $request)
    {
        $msg    = $request->input('message');
        $from   = $request->input('from') ?? 'Anon';
        $gameId = $request->input('game_id');

        event(new GameMessageSent($msg, $from, $gameId));

        return response()->json(['status' => 'ok']);
    }
}
