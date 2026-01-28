<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;
use Illuminate\Database\Eloquent\SoftDeletes;

class Admin extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'is_active',
        'last_login_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'last_login_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    // 管理者の役割
    const ROLE_ADMIN = 'admin';
    const ROLE_SUPER_ADMIN = 'super_admin';

    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        return [
            'type' => 'admin',
            'role' => $this->role,
        ];
    }

    // スーパー管理者かどうか
    public function isSuperAdmin(): bool
    {
        return $this->role === self::ROLE_SUPER_ADMIN;
    }

    public function canManageProducts(): bool
    {
        return in_array($this->role, ['super_admin', 'admin']);
    }

    public function canManageOrders(): bool
    {
        return in_array($this->role, ['super_admin', 'admin']);
    }

    public function canManageUsers(): bool
    {
        return $this->isSuperAdmin();
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // 役割でフィルター
    public function scopeByRole($query, string $role)
    {
        return $query->where('role', $role);
    }

    public function updateLastLogin(): void
    {
        $this->update(['last_login_at' => now()]);
    }
}
