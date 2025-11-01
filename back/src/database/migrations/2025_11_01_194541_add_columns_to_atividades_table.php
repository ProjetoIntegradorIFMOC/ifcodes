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
        Schema::table('atividade', function (Blueprint $table) {
            $table->foreignId('turma_id')->constrained('turma')->onDelete('cascade')->after('id');
            $table->timestamp('data_entrega')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('atividade', function (Blueprint $table) {
            $table->dropForeign(['turma_id']);
            $table->dropColumn(['turma_id']);
            $table->date('data_entrega')->change();
        });
    }
};
