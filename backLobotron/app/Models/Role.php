<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'team',
        'description',
    ];

    protected $casts = [
        
    ];


    public function gameUsers()
    {
  
        return $this->hasMany(GameUser::class);
    }
}