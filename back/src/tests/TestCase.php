<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\DB;

abstract class TestCase extends BaseTestCase
{
    use CreatesApplication;

    protected function setUp(): void
    {
        parent::setUp();

        // Register Doctrine type mapping for 'timestamp' to avoid
        // Unknown column type errors when running migrations in tests.
        try {
            $platform = DB::getDoctrineSchemaManager()->getDatabasePlatform();
            $platform->registerDoctrineTypeMapping('timestamp', 'datetime');
        } catch (\Throwable $e) {
            // If Doctrine DBAL or platform not available yet, ignore — tests
            // that need DBAL will fail later and show the real error.
        }
    }
}
