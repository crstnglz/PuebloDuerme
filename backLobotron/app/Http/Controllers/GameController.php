<?php

namespace App\Http\Controllers;

use App\Models\Game;
use App\Models\GameUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class GameController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Game::with('owner:id,nickname')->get();
    }

    /**
     * Show the form for creating a new resource.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255'
        ]);

        if($validator->fails())
        {
            return response()->json($validator->errors(), 422);
        }

        $game = Game::create([
            'name' => $request->name,
            'owner_id' => $request->user()->id,
            'max_players' => 16,
            'current_players' => 1,
            'status' => 'esperando'
        ]);

        return response()->json(
            Game::with('owner:id,nickname')->find($game->id),
             201);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Game $game)
    {
        if($request->user()->id !== $game->owner_id && $request->user()->rol !== 'admin')
        {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'status' => 'sometimes|in:waiting,playing,finished',
            'current_players' => 'sometimes|integer|min:1|max:16'
        ]);

        if($validator->fails())
        {
            return response()->json($validator->errors(), 422);
        }

        $game->update($request->all());

        return response()->json(
            Game::with('owner:id,nickname')->find($game->id), 200
        );
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Game $game)
    {
        if($request->user()->id !== $game->owner_id && $request->user()->rol !== 'admin')
        {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $game->delete();

        return response()->json(['message' => 'Partida eleminada'], 200);
    }

    public function join(Request $request, Game $game)
    {
        $user = $request->user();

        // 16/16 jugadores -> partida llena
        if($game->current_players >= $game->max_players)
        {
            return response()->json(['error' => 'La partida está llena'], 403);
        }

        // Comprobar si ya está unido
        $alreadyJoined = GameUser::where('game_id', $game->id)
        ->where('user_id', $user->id)
        ->exists();

        if(!$alreadyJoined)
        {
            //Tabla pivote
            GameUser::create([
                'game_id' => $game->id,
                'user_id' => $user->id,
                'role_id' => null,  //Luego se asigna
                'player_status' => 'alive'
            ]);

            //Incremento jugadores
            $game->increment('current_players');
        }
        return response()->json([
            'success' => true,
            'message' => 'Unido correctamente',
            'game' => Game::with('owner:id,nickname')->find($game->id)
        ], 200);
    }
}
