<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('game_users', function (Blueprint $table) {

            $table->id();
            $table->foreignId('game_id')->constrained('games')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
        
            // Se usa 'set null' para proteger el historial si se borra un rol
            $table->foreignId('role_id')->nullable()->constrained('roles')->onDelete('set null');

            $table->enum('player_status', ['alive','dead'])->default('alive');
            
            $table->boolean('is_sheriff')->default(false);
            $table->boolean('has_heal_potion')->default(false);
            $table->boolean('has_kill_potion')->default(false);
            $table->boolean('used_cupid_ability')->default(false);
            $table->boolean('used_thief_ability')->default(false);
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_users');
    }
};