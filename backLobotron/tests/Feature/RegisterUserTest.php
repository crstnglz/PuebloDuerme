<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegisterUserTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_registers_successfully()
    {
        $response = $this->postJson('/api/register', [
            'nickname'=> 'Carlos',
            'email' => 'carlos@email.com',
            'password' => 'password123',
            'password_confirmation' => 'password123'
        ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('users', [
            'email' => 'carlos@email.com'
        ]);
    }

    public function test_cannot_register_with_duplicate_email()
    {
        User::factory()->create([
            'email' => 'test@test.com'
        ]);

        $response = $this->postJson('/api/register', [
            'nickname' => 'Ramiro',
            'email' => 'test@test.com',
            'password' => 'password123',
            'password_confirmation' => 'password123'
        ]);

        $response->assertStatus(422);
    }

    public function test_fails_if_required_fields_are_missing()
    {
        $response = $this->postJson('/api/register', [
            'nickname' => '',
            'email' => '',
            'password' => '',
        ]);

        $response->assertStatus(422);
    }

    public function test_password_is_hashed()
    {
        $response = $this->postJson('/api/register', [
            'nickname' => 'Mario',
            'email' => 'mario@test.com',
            'password' => 'password123',
            'password_confirmation' => 'password123'
        ]);

        $user = User::where('email', 'mario@test.com')->first();

        $this->assertNotEquals('password123', $user->password);
        $this->assertTrue(password_verify('password123', $user->password));
    }
}
