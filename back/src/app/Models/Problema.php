<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @OA\Schema(
 *     schema="Problema",
 *     type="object",
 *     title="Problema Model",
 *     properties={
 *         @OA\Property(property="id", type="integer", readOnly="true", example=1),
 *         @OA\Property(property="titulo", type="string", description="Título do problema.", example="Soma de Dois Números"),
 *         @OA\Property(property="enunciado", type="string", format="textarea", description="Descrição completa do problema.", example="Leia dois valores inteiros e imprima a soma."),
 *         @OA\Property(property="tempo_limite", type="integer", description="Tempo limite de execução em segundos.", example=1),
 *         @OA\Property(property="memoria_limite", type="integer", description="Limite de memória em KB.", example=512),
 *         @OA\Property(property="created_at", type="string", format="date-time", readOnly="true"),
 *         @OA\Property(property="updated_at", type="string", format="date-time", readOnly="true")
 *     }
 * )
 *
 * @OA\Schema(
 *     schema="ProblemaComCasosTeste",
 *     title="Problema com Casos de Teste",
 *     description="Representa um problema completo com seus casos de teste aninhados.",
 *     allOf={
 *         @OA\Schema(ref="#/components/schemas/Problema"),
 *         @OA\Schema(
 *             type="object",
 *             properties={
 *                 @OA\Property(
 *                     property="casos_teste",
 *                     type="array",
 *                     @OA\Items(ref="#/components/schemas/CasoTeste")
 *                 )
 *             }
 *         )
 *     }
 * )
 */
class Problema extends Model
{
    use HasFactory;

    protected $table = 'problema';

    protected $fillable = [
        'titulo',
        'enunciado',
        'tempo_limite',
        'memoria_limite',
        'created_by',
    ];

    protected $with = [];
    protected $appends = [];

    public function casosTeste(){
        return $this->hasMany(CasoTeste::class, 'problema_id');
    }
    
    protected function serializeDate(\DateTimeInterface $date)
    {
        return $date->format('Y-m-d H:i:s');
    }
}
