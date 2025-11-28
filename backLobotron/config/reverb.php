<?php

return [

    'server' => [
        'host' => env('REVERB_SERVER_HOST', '0.0.0.0'),
        'port' => env('REVERB_SERVER_PORT', 9090),
    ],

    'apps' => [
        [
            'app_id' => env('REVERB_APP_ID'),
            'key' => env('REVERB_APP_KEY'),
            'secret' => env('REVERB_APP_SECRET'),
            'allowed_origins' => ['*'], // en desarrollo nos vale
        ],
    ],

    'max_request_body_size' => env('REVERB_MAX_REQUEST_BODY_SIZE', 6000000),
];
