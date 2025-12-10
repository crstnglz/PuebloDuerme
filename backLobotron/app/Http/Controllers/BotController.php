<?php

namespace App\Http\Controllers;

use App\Events\BotJoined;
use App\Events\BotsAdded;
use App\Events\GenericChatMessage;
use App\Events\WolfMessageSent;
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

    public function speak($gameId)
    {

        $game = Game::findOrFail($gameId);

        $idsInGame = $game->players()->pluck('user_id')->toArray();

        $bots = User::whereIn('id', $idsInGame)
            ->where('is_bot', true)
            ->get();

        if ($bots->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'No hay bots en esta partida.'
            ]);
        }

        // Mensajes posibles
        $messages = [
            "Creo que ha sido %PLAYER%",
            "No me fio nada de %PLAYER%",
            "Yo soy inocente, lo juro.",
            "Anoche escuché ruidos raros cerca de la casa de %PLAYER%.",
            "Tengo un mal presentimiento…",
            "¿Y si votamos a %PLAYER%?",
            "Estoy muy confundido, pero creo que %PLAYER% miente.",
            "Los lobos están entre nosotros…",
            "No sé qué pensar, pero alguien nos engaña.",
            "%PLAYER% actuó raro ayer.",
            "Fernando tiene cara de malo.", // lo ha ducho el bot jajaja
        ];

        $players = $game->players()->get();
        if ($players->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'No hay jugadores en la partida.'
            ]);
        }

        // Número de mensajes a enviar
        $count = rand(2, 5);

        $sent = [];

        for ($i = 0; $i < $count; $i++) {
            $bot = $bots->random();
            $target = $players->random();

            $msgTemplate = $messages[array_rand($messages)];
            $msg = str_replace('%PLAYER%', $target->nickname, $msgTemplate);


            event(new GenericChatMessage(
                gameId: $gameId,
                from: $bot->nickname,
                message: $msg
            ));

            $sent[] = [
                'from' => $bot->nickname,
                'message' => $msg
            ];

            sleep(1);
        }

        return response()->json([
            'success' => true,
            'sent_messages' => count($sent),
            'messages' => $sent
        ]);
    }

    public function speakWolves($gameId)
    {
        $game = Game::findOrFail($gameId);

        $role = DB::table('roles')->where('name', 'lobo')->first();
        if (!$role) {
            return response()->json(['success' => false, 'message' => 'No existe el rol lobo'], 404);
        }

        $wolfUserIds = DB::table('game_users')
            ->where('game_id', $game->id)
            ->where('role_id', $role->id)
            ->pluck('user_id')
            ->toArray();

        if (empty($wolfUserIds)) {
            return response()->json(['success' => false, 'message' => 'No hay jugadores con rol lobo'], 200);
        }

        $wolvesBots = DB::table('users')
            ->whereIn('id', $wolfUserIds)
            ->where('is_bot', true)
            ->get();

        if ($wolvesBots->isEmpty()) {
            return response()->json(['success' => false, 'message' => 'No hay bots-lobo'], 200);
        }

        $messages = [
            "Creo que ha sido %PLAYER%. Me pareció verlo muy nervioso.",
            "No me fío nada de %PLAYER%, habría que vigilarlo de cerca.",
            "Durante el día vi a %PLAYER% actuando raro, como si se supiera algo.",
            "Tengo un mal presentimiento… %PLAYER% no me cuadra.",
            "%PLAYER% actuó raro ayer, podría ser el alcalde o alguien con poder.",
            "Hay que tener cuidado con %PLAYER%, es muy listo y podría manipular la votación.",
            "Me ha parecido ver a %PLAYER% con los ojos entreabiertos, estaba raro.",
        ];

        $players = $game->players()->get();
        if ($players->isEmpty()) {
            return response()->json(['success' => false, 'message' => 'No hay jugadores en la partida'], 200);
        }

        $sent = [];
        foreach ($wolvesBots as $bot) {
            $target = $players->random();
            $template = $messages[array_rand($messages)];
            $msg = str_replace('%PLAYER%', $target->nickname, $template);

            event(new WolfMessageSent($msg, $bot->nickname, (int) $gameId));

            $sent[] = [
                'from' => $bot->nickname,
                'message' => $msg,
                'is_bot' => true
            ];

            sleep(1);
        }

        return response()->json(['success' => true, 'sent' => $sent], 200);
    }
}