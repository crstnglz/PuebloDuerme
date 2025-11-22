<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'nickname',
        'email',
        'password',
        'is_bot',
        'rol',
        'profile_photo',
        'description',
    ];

    /**
     * The attributes that should be hidden...
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast...
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'is_bot' => 'boolean', 
        'password' => 'hashed',
    ];
}