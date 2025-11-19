<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class UserAccessTest extends TestCase
{
    use RefreshDatabase;

    protected $adminUser;
    protected $adminToken;
    protected $normalUser;
    protected $normalToken;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminUser = User::factory()->create([
            'rol' => 'admin', 
            'password' => Hash::make('password'),
            'email' => 'admin@test.com'
        ]);
        $this->adminToken = $this->adminUser->createToken('admin_token', ['admin'])->plainTextToken;

        $this->normalUser = User::factory()->create([
            'rol' => 'user', 
            'password' => Hash::make('password'),
            'email' => 'normal@test.com'
        ]);
        $this->normalToken = $this->normalUser->createToken('normal_token', ['read'])->plainTextToken;
    }

    public function an_guest_cannot_access_any_crud_route() //test para los no autenticados
    {
        $this->getJson('/api/users')->assertStatus(401);
        $this->postJson('/api/users', [])->assertStatus(401); 
        $this->putJson('/api/users/1', [])->assertStatus(401);
        $this->deleteJson('/api/users/1')->assertStatus(401);
    }

    public function a_normal_user_without_admin_ability_cannot_access_crud()
    {
        $headers = ['Authorization' => 'Bearer ' . $this->normalToken];
        
        $this->withHeaders($headers)->getJson('/api/users')->assertStatus(403);
        $this->withHeaders($headers)->getJson('/api/users/' . $this->normalUser->id)->assertStatus(403);
        $this->withHeaders($headers)->postJson('/api/users', [])->assertStatus(403);
        $this->withHeaders($headers)->putJson('/api/users/' . $this->normalUser->id, [])->assertStatus(403);
        $this->withHeaders($headers)->patchJson('/api/users/' . $this->normalUser->id . '/password', [])->assertStatus(403);
        $this->withHeaders($headers)->deleteJson('/api/users/' . $this->normalUser->id)->assertStatus(403);
    }

    public function an_administrator_can_list_and_view_users()
    {
        $headers = ['Authorization' => 'Bearer ' . $this->adminToken];

        $this->withHeaders($headers)
             ->getJson('/api/users')
             ->assertStatus(200)
             ->assertJsonCount(2);

        $this->withHeaders($headers)
             ->getJson('/api/users/' . $this->normalUser->id)
             ->assertStatus(200)
             ->assertJsonFragment(['nickname' => $this->normalUser->nickname]);
    }

    public function an_administrator_can_create_a_user_store()
    {
        $headers = ['Authorization' => 'Bearer ' . $this->adminToken];
        $userData = [
            'nickname' => 'AdminCreated',
            'email' => 'admin@created.com',
            'password' => 'password12345',
            'password_confirmation' => 'password12345',
            'rol' => 'user'
        ];

        $response = $this->withHeaders($headers)
                         ->postJson('/api/users', $userData);

        $response->assertStatus(201);
        $this->assertDatabaseHas('users', ['email' => 'admin@created.com']);
    }
    
    public function an_administrator_can_update_a_user_update()
    {
        $headers = ['Authorization' => 'Bearer ' . $this->adminToken];
        $newNickname = 'UpdatedNickname';

        $response = $this->withHeaders($headers)
                         ->putJson('/api/users/' . $this->normalUser->id, [
                             'nickname' => $newNickname,
                             'email' => $this->normalUser->email,
                             'password' => 'password',
                             'password_confirmation' => 'password',
                             'rol' => 'user'
                         ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('users', ['id' => $this->normalUser->id, 'nickname' => $newNickname]);
    }
    
    public function an_administrator_can_update_password_updatePassword()
    {
        $headers = ['Authorization' => 'Bearer ' . $this->adminToken];
        $newPassword = 'NewSecurePassword123';

        $response = $this->withHeaders($headers)
                         ->patchJson('/api/users/' . $this->normalUser->id . '/password', [
                             'new_password' => $newPassword,
                             'new_password_confirmation' => $newPassword
                         ]);

        $response->assertStatus(200);
        
        $this->assertTrue(Hash::check($newPassword, $this->normalUser->fresh()->password));
    }

    
    public function an_administrator_can_delete_a_user_destroy()
    {
        $headers = ['Authorization' => 'Bearer ' . $this->adminToken];

        $response = $this->withHeaders($headers)
                         ->deleteJson('/api/users/' . $this->normalUser->id);

        $response->assertStatus(204);

        $this->assertDatabaseMissing('users', ['id' => $this->normalUser->id]);
    }
}