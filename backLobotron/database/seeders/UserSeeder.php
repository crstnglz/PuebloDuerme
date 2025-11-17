<?php

namespace Database\Seeders;

use App\Models\User; 

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //crea 10 usuarios "humanos".
        User::factory(10)->create();

        //crea 2 usuarios "bot".
        User::factory(2)->bot()->create();
        
        // crea un admin
        User::factory()
            ->admin()  
            ->create([ 
                'nickname' => 'Admin',
                'email' => 'admin@lobotron.com',
                'password' => 'admin1234' 
            ]);
    }
}