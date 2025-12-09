<?php

namespace App\Http\Controllers;

use App\Events\BotJoined;
use App\Events\BotsAdded;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Game;
use App\Models\User;

class BotController extends Controller
{
    public function fill(Request $request, $gameId)
    {
        $game = Game::findOrFail($gameId);

        

        // Contamos los jugadores que hay en la partida
        $currentPlayers = DB::table('game_users')
            ->where('game_id', $game->id)
            ->count();

        $totalSlots = (int) $game->max_players; // 30
        if ($currentPlayers >= $totalSlots) {
            return response()->json([
                'success' => true,
                'added' => [],
                'message' => 'La partida ya está completa.'
            ]);
        }

        $needed = $totalSlots - $currentPlayers;
        $added = [];

        // Extraemos los ids de los jugadores que hay en la partida (para no repetir bots)
        $idsInGame = DB::table('game_users')
            ->where('game_id', $game->id)
            ->pluck('user_id')
            ->toArray();

        // Bots libres existentes
        $freeBots = DB::table('users')
            ->where('is_bot', true)
            ->whereNotIn('id', $idsInGame)
            ->limit($needed)
            ->get();

        foreach ($freeBots as $botRow) {
            DB::table('game_users')->insert([
                'game_id' => $game->id,
                'user_id' => $botRow->id,
                'role_id' => null,
                'player_status' => 'alive',
                'is_sheriff' => false,
                'has_heal_potion' => false,
                'has_kill_potion' => false,
                'used_cupid_ability' => false,
                'used_thief_ability' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $added[] = [
                'id' => $botRow->id,
                'nickname' => $botRow->nickname,
                'is_bot' => true,
                'profile_photo' => $botRow->profile_photo ?? null,
            ];

            $needed--;
        }

        // Si aún faltan, creamos más bots con factory (ponga los bots que ponga en el seeder, esto va hacer falta)
        for ($i = 0; $i < $needed; $i++) {
            $bot = User::factory()->bot()->create();

            DB::table('game_users')->insert([
                'game_id' => $game->id,
                'user_id' => $bot->id,
                'role_id' => null,
                'player_status' => 'alive',
                'is_sheriff' => false,
                'has_heal_potion' => false,
                'has_kill_potion' => false,
                'used_cupid_ability' => false,
                'used_thief_ability' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $added[] = [
                'id' => $bot->id,
                'nickname' => $bot->nickname,
                'is_bot' => true,
                'profile_photo' => $bot->profile_photo ?? null,
            ];
        }

        // Actualizamos el número de jugadores
        $newCount = DB::table('game_users')->where('game_id', $game->id)->count();
        $game->current_players = $newCount;
        $game->save();

        event(new BotJoined($game, $added));

        return response()->json([
            'success' => true,
            'added' => $added,
            'current_players' => $newCount,
            'max_players' => $totalSlots,
            'message' => 'Bots añadidos hasta completar la partida.'
        ], 200);
    }
}
