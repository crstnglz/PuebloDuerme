<?php

namespace App\Http\Controllers;

use App\Models\Game;
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
            'status' => 'waiting'
        ]);

        return response()->json($game, 201);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Game $game)
    {
        if($request->user()->rol !== 'admin')
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

        return response()->json($game, 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Game $game)
    {
        if($request->user()->rol !== 'admin')
        {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $game->delete();

        return response()->json(['message' => 'Partida eleminada'], 200);
    }
}
