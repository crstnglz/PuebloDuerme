<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;

class BotSeeder extends Seeder
{
    public function run()
    {
        // 30 bots
        for ($i = 0; $i < 30; $i++) {
            User::factory()->bot()->create();
        }
    }
}
