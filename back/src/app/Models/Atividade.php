<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @OA\Schema(
 *     schema="Atividade",
 *     type="object",
 *     title="Atividade Model",
 *     properties={
 *         @OA\Property(property="id", type="integer", readOnly="true", example=1),
 *         @OA\Property(property="data_entrega", type="string", format="date-time", description="Prazo final para a entrega da atividade", example="2024-05-20T23:59:59Z"),
 *         @OA\Property(property="problema_id", type="integer", description="ID do problema associado a esta atividade", example=1),
 *         @OA\Property(property="created_at", type="string", format="date-time", readOnly="true"),
 *         @OA\Property(property="updated_at", type="string", format="date-time", readOnly="true")
 *     }
 * )
 *
 * @OA\Schema(
 *     schema="AtividadeComProblema",
 *     title="Atividade com Problema Detalhado",
 *     description="Representa uma atividade completa com os dados do problema aninhados.",
 *     allOf={
 *         @OA\Schema(ref="#/components/schemas/Atividade"),
 *         @OA\Schema(
 *             type="object",
 *             properties={
 *                 @OA\Property(property="problema", ref="#/components/schemas/Problema")
 *             }
 *         )
 *     }
 * )
 */
class Atividade extends Model
{
    protected $table = 'atividade';
    protected $fillable = [
        'data_entrega',
        'problema_id',
        'turma_id',
    ];

    protected $casts = [
        'data_entrega' => 'datetime',
    ];

    public function problema()
    {
        return $this->hasOne(Problema::class, 'id', 'problema_id');
    }

    public function turma()
    {
        return $this->belongsTo(Turma::class, 'turma_id');
    }
}
