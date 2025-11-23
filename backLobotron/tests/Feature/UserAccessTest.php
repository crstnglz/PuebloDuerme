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

    public function test_guest_cannot_access_any_crud_route()
    {
        $this->getJson('/api/users')->assertStatus(401);
        $this->postJson('/api/users', [])->assertStatus(401); 
        $this->putJson('/api/users/1', [])->assertStatus(401);
        $this->deleteJson('/api/users/1')->assertStatus(401);
    }

    public function test_normal_user_without_admin_ability_cannot_access_crud()
    {
        $headers = ['Authorization' => 'Bearer ' . $this->normalToken];
        
        $this->withHeaders($headers)->getJson('/api/users')->assertStatus(403);
        $this->withHeaders($headers)->getJson('/api/users/' . $this->normalUser->id)->assertStatus(403);
        $this->withHeaders($headers)->postJson('/api/users', [])->assertStatus(403);
        $this->withHeaders($headers)->putJson('/api/users/' . $this->normalUser->id, [])->assertStatus(403);
        $this->withHeaders($headers)->patchJson('/api/users/' . $this->normalUser->id . '/password', [])->assertStatus(403);
        $this->withHeaders($headers)->deleteJson('/api/users/' . $this->normalUser->id)->assertStatus(403);
    }

    public function test_admin_can_list_and_view_users()
    {
        $headers = ['Authorization' => 'Bearer ' . $this->adminToken];

        $this->withHeaders($headers)
             ->getJson('/api/users')
             ->assertStatus(200)
             ->assertJsonCount(2, 'data');


        $this->withHeaders($headers)
             ->getJson('/api/users/' . $this->normalUser->id)
             ->assertStatus(200)
             ->assertJsonFragment(['nickname' => $this->normalUser->nickname]);
    }

    public function test_admin_can_create_user()
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
    
    public function test_admin_can_update_user()
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
    
    public function test_admin_can_update_password()
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

    public function test_admin_can_delete_user()
    {
        $headers = ['Authorization' => 'Bearer ' . $this->adminToken];

        $response = $this->withHeaders($headers)
                         ->deleteJson('/api/users/' . $this->normalUser->id);

        $response->assertStatus(204);

        $this->assertDatabaseMissing('users', ['id' => $this->normalUser->id]);
    }

    public function test_admin_can_search_users_by_id()
    {
        $headers = ['Authorization' => 'Bearer ' . $this->adminToken];

        $response = $this->withHeaders($headers)
            ->getJson('/api/users/find?type=id&query=' . $this->normalUser->id);

        $response->assertStatus(200)
                 ->assertJsonFragment(['id' => $this->normalUser->id]);
    }

    public function test_admin_can_search_users_by_email()
    {
        $headers = ['Authorization' => 'Bearer ' . $this->adminToken];

        $response = $this->withHeaders($headers)
            ->getJson('/api/users/find?type=email&query=' . substr($this->normalUser->email, 0, 3));

        $response->assertStatus(200)
                 ->assertJsonFragment(['email' => $this->normalUser->email]);
    }

    public function test_admin_can_search_users_by_nickname()
    {
        $headers = ['Authorization' => 'Bearer ' . $this->adminToken];

        $response = $this->withHeaders($headers)
            ->getJson('/api/users/find?type=nickname&query=' . substr($this->normalUser->nickname, 0, 2));

        $response->assertStatus(200)
                 ->assertJsonFragment(['nickname' => $this->normalUser->nickname]);
    }

    public function test_find_fails_without_required_parameters()
    {
        $headers = ['Authorization' => 'Bearer ' . $this->adminToken];

        $response = $this->withHeaders($headers)
            ->getJson('/api/users/find');

        $response->assertStatus(422)
                 ->assertJsonFragment(['Parámetros incompletos o inválidos']);
    }

    public function test_find_fails_with_invalid_type()
    {
        $headers = ['Authorization' => 'Bearer ' . $this->adminToken];

        $response = $this->withHeaders($headers)
            ->getJson('/api/users/find?type=wrong&query=test');

        $response->assertStatus(400)
                 ->assertJsonFragment(['El tipo debe ser id, email o nickname']);
    }
}