<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('submissao', function (Blueprint $table) {
            $table->foreignId('user_id')->after('id')->constrained('users')->nullable(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('submissao', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
        });

        Schema::dropColumns('submissao', ['user_id']);
    }
};
