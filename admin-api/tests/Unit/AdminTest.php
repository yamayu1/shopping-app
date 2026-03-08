<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\Admin;
use Illuminate\Foundation\Testing\RefreshDatabase;

class AdminTest extends TestCase
{
    use RefreshDatabase;

    // Role constants

    /** @test */
    public function it_has_role_constants(): void
    {
        $this->assertEquals('admin', Admin::ROLE_ADMIN);
        $this->assertEquals('super_admin', Admin::ROLE_SUPER_ADMIN);
    }

    /* --- isSuperAdmin --- */

    public function test_it_identifies_super_admin(): void
    {
        $superAdmin = Admin::factory()->superAdmin()->create();
        $admin = Admin::factory()->create(['role' => 'admin']);

        $this->assertTrue($superAdmin->isSuperAdmin());
        $this->assertFalse($admin->isSuperAdmin());
    }

    /** @test */
    public function super_admin_can_manage_products(): void
    {
        $admin = Admin::factory()->superAdmin()->create();
        $this->assertTrue($admin->canManageProducts());
    }

    // -- Scopes --

    public function test_scope_active_returns_only_active_admins(): void
    {
        Admin::factory()->create(['is_active' => true]);
        Admin::factory()->create(['is_active' => false]);
        Admin::factory()->create(['is_active' => true]);

        $activeAdmins = Admin::active()->get();

        $this->assertCount(2, $activeAdmins);
        $activeAdmins->each(function ($admin) {
            $this->assertTrue($admin->is_active);
        });
    }

    /** @test */
    public function it_uses_soft_deletes(): void
    {
        $admin = Admin::factory()->create();
        $admin->delete();

        $this->assertSoftDeleted('admins', ['id' => $admin->id]);
        $this->assertNull(Admin::find($admin->id));
        $this->assertNotNull(Admin::withTrashed()->find($admin->id));
    }
}
