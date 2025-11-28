<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'must_change_password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    /**
     * Relacionamento: Um User tem um Aluno
     */
    public function aluno(): HasOne
    {
        return $this->hasOne(Aluno::class);
    }

    /**
     * Relacionamento: Um User tem um Professor
     */
    public function professor(): HasOne
    {
        return $this->hasOne(Professor::class, 'id', 'id');
    }

    /**
     * Boot method para garantir deleção em cascata
     */
    protected static function boot()
    {
        parent::boot();

        static::deleting(function ($user) {
            $user->aluno()->delete();
            $user->professor()->delete();
        });
    }
}
