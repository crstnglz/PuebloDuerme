<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class GamePhasesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Limpiamos la tabla antes de insertar para evitar duplicados si se corre varias veces
        DB::table('game_phases')->truncate();

        $phases = [
            [
                'name' => 'Night', 
                'duration_minutes' => 1, 
                'created_at' => now(), 
                'updated_at' => now()
            ],
            [
                'name' => 'Day', 
                'duration_minutes' => 1, 
                'created_at' => now(), 
                'updated_at' => now()
            ],
        ];

        DB::table('game_phases')->insert($phases);
    }
}