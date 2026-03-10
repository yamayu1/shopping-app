<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Admin;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    // Login

    /** @test */
    public function admin_can_login_with_valid_credentials(): void
    {
        $admin = Admin::factory()->create([
            'email' => 'admin@test.com',
            'password' => Hash::make('password123'),
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/admin/login', [
            'email' => 'admin@test.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
                 ->assertJsonPath('success', true)
                 ->assertJsonStructure([
                     'success',
                     'message',
                     'data' => [
                         'access_token',
                         'token_type',
                         'expires_in',
                         'admin',
                     ],
                 ]);
    }

    /** @test */
    public function login_fails_with_invalid_password(): void
    {
        Admin::factory()->create([
            'email' => 'admin@test.com',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/admin/login', [
            'email' => 'admin@test.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(401)
                 ->assertJsonPath('success', false);
    }

    // Me (profile retrieval)

    /** @test */
    public function authenticated_admin_can_get_profile(): void
    {
        $admin = Admin::factory()->create();

        $response = $this->actingAs($admin, 'admin')
                         ->getJson('/api/admin/auth/me');

        $response->assertStatus(200)
                 ->assertJsonPath('success', true)
                 ->assertJsonStructure([
                     'data' => [
                         'admin' => ['id', 'name', 'email', 'role'],
                     ],
                 ]);
    }

    /** @test */
    public function unauthenticated_user_cannot_get_profile(): void
    {
        $response = $this->getJson('/api/admin/auth/me');
        $response->assertStatus(401);
    }

    /** @test */
    public function authenticated_admin_can_logout(): void
    {
        $admin = Admin::factory()->create();

        $response = $this->actingAs($admin, 'admin')
                         ->postJson('/api/admin/auth/logout');

        $response->assertStatus(200)
                 ->assertJsonPath('success', true);
    }

    // Register (super admin only)

    /** @test */
    public function super_admin_can_register_new_admin(): void
    {
        $superAdmin = Admin::factory()->superAdmin()->create();

        $response = $this->actingAs($superAdmin, 'admin')
                         ->postJson('/api/admin/auth/register', [
                             'name' => 'New Admin',
                             'email' => 'newadmin@test.com',
                             'password' => 'password123',
                             'password_confirmation' => 'password123',
                             'role' => 'admin',
                         ]);

        $response->assertStatus(201)
                 ->assertJsonPath('success', true);

        $this->assertDatabaseHas('admins', [
            'email' => 'newadmin@test.com',
            'role' => 'admin',
        ]);
    }
}
