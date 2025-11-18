<?php

namespace Tests;

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\DB;

trait CreatesApplication
{
    /**
     * Creates the application.
     */
    public function createApplication(): Application
    {
        $app = require __DIR__.'/../bootstrap/app.php';

        $app->make(Kernel::class)->bootstrap();

        // Ensure Doctrine DBAL knows how to map 'timestamp' when migrations run
        // during tests. This avoids "Unknown column type 'timestamp' requested" errors.
        try {
            // Try via the default connection's schema manager first
            $conn = DB::connection();
            if (method_exists($conn, 'getDoctrineSchemaManager')) {
                $platform = $conn->getDoctrineSchemaManager()->getDatabasePlatform();
            } else {
                $platform = DB::getDoctrineSchemaManager()->getDatabasePlatform();
            }

            // Register several timestamp variants to be safe across platforms
            foreach (['timestamp', 'timestamptz', 'timestamp without time zone', 'timestamp with time zone'] as $type) {
                $platform->registerDoctrineTypeMapping($type, 'datetime');
            }
        } catch (\Throwable $e) {
            // ignore if DBAL/platform not available in this environment
        }

        return $app;
    }
}
