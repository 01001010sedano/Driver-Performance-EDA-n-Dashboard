<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DriverProfile extends Model
{
    protected $fillable = [
        'driver_id',
        'date',
        'delays_minutes',
        'behavioral_problems',
        'violations_count',
        'accidents_count',
        'rating',
        'route_id',
        'vehicle_id',
        'shift',
    ];

    protected $casts = [
        'date'                => 'date',
        'delays_minutes'      => 'integer',
        'behavioral_problems' => 'integer',
        'violations_count'    => 'integer',
        'accidents_count'     => 'integer',
        'rating'              => 'float',
    ];
}
