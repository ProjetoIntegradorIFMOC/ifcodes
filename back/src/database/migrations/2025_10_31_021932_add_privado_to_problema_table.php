<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('problema', function (Blueprint $table) {
            $table->boolean('privado')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('problema', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
            $table->dropColumn(['privado', 'created_by']);
        });
    }
};
