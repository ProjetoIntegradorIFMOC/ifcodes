<?php

namespace App\Models;

use App\Facades\Judge0;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @OA\Schema(
 *     schema="Submissao",
 *     type="object",
 *     title="Submissao Model",
 *     description="Representa uma submissão de código de uma atividade.",
 *     properties={
 *         @OA\Property(property="id", type="integer", readOnly="true", example=1),
 *         @OA\Property(property="data_submissao", type="string", format="date-time", readOnly="true", example="2023-10-27T10:00:00Z"),
 *         @OA\Property(property="codigo", type="string", description="Código fonte submetido pelo usuário.", example="print('Hello, World!')"),
 *         @OA\Property(property="linguagem", type="string", description="Linguagem de programação utilizada (definida no backend).", example="python"),
 *         @OA\Property(property="atividade_id", type="integer", description="ID da atividade relacionada.", example=101),
 *         @OA\Property(property="created_at", type="string", format="date-time", readOnly="true", example="2023-10-27T10:00:00Z"),
 *         @OA\Property(property="updated_at", type="string", format="date-time", readOnly="true", example="2023-10-27T10:00:00Z")
 *     }
 * )
 */
class Submissao extends Model
{
    protected $table = 'submissao';
    protected $fillable = [
        'id',
        'data_submissao',
        'codigo',
        'linguagem',
        'atividade_id',
        'user_id',
        'status_correcao_id'
    ];

    public function atividade(): BelongsTo
    {
        return $this->belongsTo(Atividade::class);
    }

    public function correcoes()
    {
        return $this->hasMany(Correcao::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function statusCorrecao(): BelongsTo
    {
        return $this->belongsTo(StatusCorrecao::class, 'status_correcao_id');
    }

    public function getStatus(): array
    {
        $resultados = Judge0::getResultados($this);
        $resposta = [];
        foreach ($resultados as $resultado) {
            $resposta['status'] = StatusCorrecao::find($resultado['status_id'])->nome;
            if ($resultado['status_id'] == 4) {
                $resposta['erro_teste'] = Correcao::where('token', $resultado['token'])->first()->caso_teste_id;
            }
            else if ($resultado['status_id'] == 6) {
                $resposta['erro'] = base64_decode($resultado['compile_output']);
            }
            if($resultado['status_id'] != 3) {
                return $resposta;
            }
        }
        return $resposta;
    }
}
