<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
       {
        Schema::create('users', function (Blueprint $table) {
            $table->id()->primary(); 
        
            $table->string('nickname')->unique(); 
            $table->string('email')->unique();
            $table->string('password');
            
            $table->boolean('is_bot')->default(false); 
            
            $table->timestamp('email_verified_at')->nullable();
            $table->rememberToken();
            $table->timestamps(); 
        });
    }
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
