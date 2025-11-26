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
            $table->foreignId('status_correcao_id')->constrained('status_correcao')->nullable(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('submissao', function (Blueprint $table) {
            $table->dropForeign(['status_correcao_id']);
        });

        Schema::dropColumns('submissao', ['status_correcao_id']);
    }
};
