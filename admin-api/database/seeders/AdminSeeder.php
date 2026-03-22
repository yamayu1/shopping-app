<?php

namespace Database\Seeders;

use App\Models\Admin;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // スーパー管理者を作成
        Admin::firstOrCreate(
            ['email' => 'superadmin@example.com'],
            [
                'name' => 'Super Admin',
                'email' => 'superadmin@example.com',
                'password' => Hash::make('password123'),
                'role' => 'super_admin',
                'is_active' => true,
            ]
        );

        // 一般管理者を作成
        Admin::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Admin User',
                'email' => 'admin@example.com',
                'password' => Hash::make('password123'),
                'role' => 'admin',
                'is_active' => true,
            ]
        );

        // マネージャーを作成
        Admin::firstOrCreate(
            ['email' => 'manager@example.com'],
            [
                'name' => 'Manager User',
                'email' => 'manager@example.com',
                'password' => Hash::make('password123'),
                'role' => 'manager',
                'is_active' => true,
            ]
        );

        // 編集者を作成
        Admin::firstOrCreate(
            ['email' => 'editor@example.com'],
            [
                'name' => 'Editor User',
                'email' => 'editor@example.com',
                'password' => Hash::make('password123'),
                'role' => 'editor',
                'is_active' => true,
            ]
        );

        $this->command->info('Admin users seeded successfully');
    }
}