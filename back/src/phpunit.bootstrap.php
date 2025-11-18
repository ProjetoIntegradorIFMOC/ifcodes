<?php

// PHPUnit bootstrap that fully boots the framework once and registers
// Doctrine DBAL type mappings necessary for running migrations in tests.

require __DIR__ . '/vendor/autoload.php';

$app = require __DIR__ . '/bootstrap/app.php';

$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Register Doctrine type mappings early so migrations that use 'timestamp'
// or similar types won't fail during test database introspection.
try {
    // Register Doctrine types (safer) and platform mappings early.
    if (class_exists(\Doctrine\DBAL\Types\Type::class)) {
        // Ensure 'timestamp' is known to DBAL
        if (!\Doctrine\DBAL\Types\Type::hasType('timestamp')) {
            \Doctrine\DBAL\Types\Type::addType('timestamp', \Doctrine\DBAL\Types\DateTimeType::class);
        }
        if (!\Doctrine\DBAL\Types\Type::hasType('timestamptz')) {
            \Doctrine\DBAL\Types\Type::addType('timestamptz', \Doctrine\DBAL\Types\DateTimeTzType::class);
        }
    }

    // Use the DB facade to obtain the Doctrine platform and add mappings
    $platform = Illuminate\Support\Facades\DB::getDoctrineSchemaManager()->getDatabasePlatform();
    foreach (['timestamp', 'timestamptz', 'timestamp without time zone', 'timestamp with time zone'] as $type) {
        try {
            $platform->registerDoctrineTypeMapping($type, 'datetime');
        } catch (\Throwable $e) {
            // ignore individual mapping failures
        }
    }
} catch (Throwable $e) {
    // ignore — if DBAL/platform not available here, tests will report the original error
}
