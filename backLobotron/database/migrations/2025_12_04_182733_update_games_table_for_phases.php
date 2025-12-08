<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('games', function (Blueprint $table) {

            $table->foreignId('current_phase_id')
                  ->nullable() // Puede ser nulo antes de iniciar el juego
                  ->constrained('game_phases')
                  ->after('status'); 
    
            $table->timestamp('phase_ends_at')->nullable()->after('current_phase_id');
            $table->unsignedInteger('turn_number')->default(0)->after('phase_ends_at');
        });
    }

    public function down(): void
    {
        Schema::table('games', function (Blueprint $table) {
            $table->dropForeign(['current_phase_id']);
            $table->dropColumn(['current_phase_id', 'phase_ends_at', 'turn_number']);
        });
    }
};