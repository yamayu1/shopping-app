<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Admin;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class UserApiTest extends TestCase
{
    use RefreshDatabase;

    private Admin $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = Admin::factory()->create(['role' => 'admin']);
    }

    /** @test */
    public function it_lists_users_with_pagination(): void
    {
        User::factory()->count(5)->create();

        $response = $this->actingAs($this->admin, 'admin')
                         ->getJson('/api/admin/users');

        $response->assertStatus(200)
                 ->assertJsonPath('success', true)
                 ->assertJsonStructure([
                     'data' => [
                         'data',
                         'pagination',
                     ],
                 ]);
    }

    // Show

    /** @test */
    public function it_shows_a_single_user(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($this->admin, 'admin')
                         ->getJson("/api/admin/users/{$user->id}");

        $response->assertStatus(200)
                 ->assertJsonPath('success', true)
                 ->assertJsonPath('data.id', $user->id);
    }

    /** @test */
    public function it_returns_404_for_nonexistent_user(): void
    {
        $response = $this->actingAs($this->admin, 'admin')
                         ->getJson('/api/admin/users/99999');

        $response->assertStatus(404);
    }

    // Destroy (soft delete)

    /** @test */
    public function it_soft_deletes_a_user(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($this->admin, 'admin')
                         ->deleteJson("/api/admin/users/{$user->id}");

        $response->assertStatus(200)
                 ->assertJsonPath('success', true);

        $this->assertNotNull($user->fresh()->deleted_at);
    }
}
